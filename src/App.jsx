/* App.jsx
  Single-file React component for "Pocket Progress". Features included:
  - Center pie chart showing progress toward a target.
  - Thumb-friendly rotary knob (pointer drag) that changes a pending value in 1,000 steps.
  - Grouped quick buttons: -10k | -1k | +1k | +10k that update the pending value.
  - Tap the knob's pending value to commit (prompts for optional label), which adds an entry and updates progress.
  - Settings drawer with full entries manager: edit (amount & label) inline, delete, clear all, set target, reset.
  - All persistent data stored to localStorage.
  - Minimal Tailwind-style classes used (you can replace with plain CSS if not using Tailwind).
*/
import React, { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const STORAGE_KEYS = {
    TARGET: "fp_targetSum_v1",
    PROGRESS: "fp_progress_v1",
    ENTRIES: "fp_entries_v1",
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function App() {
    // Persistent state
    const [targetSum, setTargetSum] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEYS.TARGET);
        return raw ? Number(raw) : 100000;
    });
    const [progress, setProgress] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
        return raw ? Number(raw) : 25000;
    });
    const [entries, setEntries] = useState(() => {
        const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (err) {
            console.error("Failed parsing entries from localStorage", err);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.TARGET, String(targetSum));
    }, [targetSum]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.PROGRESS, String(progress));
    }, [progress]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    }, [entries]);

    // Derived values
    const percent =
        targetSum === 0
            ? 0
            : Math.min(100, Math.round((progress / targetSum) * 10000) / 100);

    // Knob & pending value
    const [knobValue, setKnobValue] = useState(1000);
    const knobRef = useRef(null);
    const pointerActive = useRef(false);
    const lastAngle = useRef(null);

    // Settings drawer
    const [showSettings, setShowSettings] = useState(false);

    // Edit state for entries list
    const [editIdx, setEditIdx] = useState(null);
    const [editAmount, setEditAmount] = useState("");
    const [editName, setEditName] = useState("");

    // Alert state for Clear All
    const [showClearAlert, setShowClearAlert] = useState(false);

    // Add an entry (amount can be negative to retract)
    function addEntry(amount, partName = "") {
        const newAmount = Number(amount);
        if (Number.isNaN(newAmount) || newAmount === 0) {
            // Do nothing for NaN or zero
            return;
        }
        const entry = {
            amount: newAmount,
            partName: partName ? String(partName) : null,
            date: new Date().toISOString(),
        };
        setEntries((prev) => [entry, ...prev]);
        setProgress((p) => p + newAmount);
    }

    // Knob rotation handling (pointer events)
    useEffect(() => {
        const el = knobRef.current;
        if (!el) return undefined;

        function onPointerDown(e) {
            e.preventDefault();
            pointerActive.current = true;
            lastAngle.current = e.clientX; // Track horizontal position
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
        }

        function onPointerMove(e) {
            if (!pointerActive.current) return;
            const deltaX = e.clientX - lastAngle.current; // Horizontal movement
            const STEP_SIZE = 10; // Adjust step size for sensitivity
            const steps = Math.round(deltaX / STEP_SIZE);

            if (steps !== 0) {
                setKnobValue((v) =>
                    clamp(v + steps * 1000, 0, Math.max(1000, targetSum * 2))
                );
                lastAngle.current = e.clientX; // Update last position
            }
        }

        function onPointerUp() {
            pointerActive.current = false;
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        }

        el.addEventListener("pointerdown", onPointerDown);

        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, [targetSum]);

    // Commit knob: prompt for optional label and add entry
    function commitKnob() {
        addEntry(knobValue, "");
        setKnobValue(1000);
    }

    // Entries editing
    function startEdit(idx) {
        const entry = entries[idx];
        if (!entry) return;
        setEditIdx(idx);
        setEditAmount(String(entry.amount));
        setEditName(entry.partName || "");
    }

    function cancelEdit() {
        setEditIdx(null);
        setEditAmount("");
        setEditName("");
    }

    function saveEdit() {
        if (editIdx === null) return;
        const parsed = Number(editAmount);
        if (Number.isNaN(parsed)) {
            alert("Enter a valid numeric amount");
            return;
        }
        setEntries((prev) => {
            const prevEntry = prev[editIdx];
            const updatedEntry = {
                ...prevEntry,
                amount: parsed,
                partName: editName ? editName.trim() : null,
            };
            const copy = prev.slice();
            copy[editIdx] = updatedEntry;
            return copy;
        });
        setProgress((p) => {
            const old = Number(entries[editIdx]?.amount ?? 0);
            return p - old + parsed;
        });
        cancelEdit();
    }

    function deleteEntry(idx) {
        const ent = entries[idx];
        if (!ent) return;
        if (editIdx === idx) cancelEdit();
        setEntries((prev) => prev.filter((_, i) => i !== idx));
        setProgress((p) => p - Number(ent.amount));
    }

    function clearAllEntries() {
        setEntries([]);
        setProgress(0);
        cancelEdit();
        setShowClearAlert(false); // Close the alert
    }

    const remaining = Math.max(0, targetSum - progress);
    const pieData = [
        { name: "Progress", value: Math.min(progress, targetSum) },
        { name: "Remaining", value: Math.max(0, targetSum - progress) },
    ];

    return (
        <div
            className="min-h-screen bg-gray-50 text-gray-900 flex flex-col"
            style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            <header className="flex items-center justify-between px-4 py-3 border-b bg-white/60 backdrop-blur">
                <h1 className="text-lg font-semibold">Pocket Progress</h1>
                <div>
                    <button
                        type="button"
                        onClick={() => setShowSettings((s) => !s)}
                        className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-sm"
                    >
                        Settings
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center gap-4">
                        <div className="w-full flex items-center justify-center">
                            <div className="relative flex flex-col items-center">
                                <PieChart width={220} height={220}>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        innerRadius={68}
                                        outerRadius={96}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        <Cell key="progress" fill="#60a5fa" />
                                        <Cell key="remain" fill="#e5e7eb" />
                                    </Pie>
                                </PieChart>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-3xl font-bold">{percent}%</div>
                                    <div className="text-xs text-gray-500">
                                        {new Intl.NumberFormat().format(progress)} /{" "}
                                        {new Intl.NumberFormat().format(targetSum)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full mt-2 text-center">
                            <div className="text-sm text-gray-600">
                                {" "}
                                Remaining:{" "}
                                <span className="font-medium">
                  {" "}
                                    {new Intl.NumberFormat().format(remaining)}{" "}
                </span>{" "}
                            </div>
                        </div>
                        <div className="w-full mt-2 text-left">
                            <div className="text-xs text-gray-400">Recent</div>
                            <div className="w-full max-h-28 overflow-auto mt-2">
                                {entries.length === 0 ? (
                                    <div className="text-sm text-gray-500">No entries yet</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {entries.slice(0, 6).map((e, i) => (
                                            <li key={i} className="flex justify-between text-sm">
                                                <div>
                                                    <div className="font-medium">
                                                        {e.partName || "—"}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {" "}
                                                        {new Date(e.date).toLocaleString()}{" "}
                                                    </div>
                                                </div>
                                                <div className="self-center">
                                                    {" "}
                                                    {e.amount >= 0 ? "+" : ""}{" "}
                                                    {new Intl.NumberFormat().format(e.amount)}{" "}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Bottom rotary input area */}
            <div
                className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur border-t"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
            >
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 flex items-center justify-center">
                        <div
                            ref={knobRef}
                            className="w-28 h-28 rounded-full bg-gray-100 shadow-inner flex items-center justify-center touch-none select-none"
                            style={{ userSelect: "none" }}
                        >
                            <button
                                type="button"
                                onClick={commitKnob}
                                className="w-full h-full rounded-full flex flex-col items-center justify-center focus:outline-none"
                            >
                                <motion.div whileTap={{ scale: 0.97 }}>
                                    <div className="text-sm text-gray-500">Add</div>
                                    <div className="text-xl font-semibold">
                                        {" "}
                                        {new Intl.NumberFormat().format(knobValue)}{" "}
                                    </div>
                                </motion.div>
                            </button>
                        </div>
                    </div>
                    {/* Grouped quick buttons */}
                    <div className="grid grid-cols-2 gap-2 ml-auto">
                        <button
                            type="button"
                            onClick={() =>
                                setKnobValue((v) =>
                                    clamp(v - 1000, 0, Math.max(1000, targetSum * 2))
                                )
                            }
                            className="px-3 py-2 rounded-md bg-gray-100 text-sm"
                        >
                            {" "}
                            -1k{" "}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setKnobValue((v) =>
                                    clamp(v + 1000, 0, Math.max(1000, targetSum * 2))
                                )
                            }
                            className="px-3 py-2 rounded-md bg-gray-100 text-sm"
                        >
                            {" "}
                            +1k{" "}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setKnobValue((v) =>
                                    clamp(v - 10000, 0, Math.max(1000, targetSum * 2))
                                )
                            }
                            className="px-3 py-2 rounded-md bg-gray-100 text-sm"
                        >
                            {" "}
                            -10k{" "}
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setKnobValue((v) =>
                                    clamp(v + 10000, 0, Math.max(1000, targetSum * 2))
                                )
                            }
                            className="px-3 py-2 rounded-md bg-gray-100 text-sm"
                        >
                            {" "}
                            +10k{" "}
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings drawer */}
            {showSettings && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-40"
                    onClick={() => {
                        cancelEdit();
                        setShowSettings(false);
                    }}
                >
                    <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-semibold mb-2">Settings</h2>
                        <div className="space-y-3">
                            <label className="text-xs text-gray-500">Target sum</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={targetSum}
                                    onChange={(e) => setTargetSum(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 border rounded-md"
                                />
                                <button
                                    type="button"
                                    className="px-3 py-2 rounded-md bg-gray-100"
                                    onClick={() => {
                                        setProgress(0);
                                        setEntries([]);
                                        cancelEdit();
                                    }}
                                >
                                    {" "}
                                    Reset{" "}
                                </button>
                            </div>
                            <div className="text-xs text-gray-400">
                                {" "}
                                All settings saved locally.{" "}
                            </div>
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-2">Manage Entries</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        type="button"
                                        className="px-3 py-2 rounded-md bg-red-50 text-sm"
                                        onClick={() => setShowClearAlert(true)}
                                    >
                                        {" "}
                                        Clear all{" "}
                                    </button>
                                </div>
                                {entries.length === 0 ? (
                                    <div className="text-xs text-gray-500">No entries yet</div>
                                ) : (
                                    <ul className="max-h-48 overflow-auto divide-y">
                                        {entries.map((e, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start justify-between py-2 text-sm"
                                            >
                                                <div className="flex-1">
                                                    {editIdx === i ? (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    {" "}
                                                                    Amount{" "}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="w-full px-2 py-1 border rounded-md mt-1"
                                                                    value={editAmount}
                                                                    onChange={(ev) =>
                                                                        setEditAmount(ev.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-500">
                                                                    {" "}
                                                                    Label (optional){" "}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-2 py-1 border rounded-md mt-1"
                                                                    value={editName}
                                                                    onChange={(ev) =>
                                                                        setEditName(ev.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                <button
                                                                    type="button"
                                                                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs"
                                                                    onClick={saveEdit}
                                                                >
                                                                    {" "}
                                                                    Save{" "}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="px-3 py-1 bg-gray-100 rounded-md text-xs"
                                                                    onClick={cancelEdit}
                                                                >
                                                                    {" "}
                                                                    Cancel{" "}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium">
                                                                {" "}
                                                                {e.partName || "—"}{" "}
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {" "}
                                                                {new Date(e.date).toLocaleString()}{" "}
                                                            </div>
                                                            <div className="text-xs mt-1">
                                                                {" "}
                                                                {e.amount >= 0 ? "+" : ""}{" "}
                                                                {new Intl.NumberFormat().format(e.amount)}{" "}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-2">
                                                    {editIdx === i ? null : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 bg-gray-100 rounded-md text-xs"
                                                                onClick={() => startEdit(i)}
                                                            >
                                                                {" "}
                                                                Edit{" "}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-xs"
                                                                onClick={() => deleteEntry(i)}
                                                            >
                                                                {" "}
                                                                Delete{" "}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                className="px-4 py-2 rounded-md bg-blue-600 text-white"
                                onClick={() => {
                                    cancelEdit();
                                    setShowSettings(false);
                                }}
                            >
                                {" "}
                                Done{" "}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear all confirmation alert */}
            {showClearAlert && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h2 className="text-lg font-semibold mb-4">Clear all entries?</h2>
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                className="px-4 py-2  bg-gray-100  rounded-md"
                                onClick={clearAllEntries}
                            >
                                {" "}
                                Yes{" "}
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-red-500 text-white rounded-md"
                                onClick={() => setShowClearAlert(false)}
                            >
                                {" "}
                                Fuck, no!{" "}
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}