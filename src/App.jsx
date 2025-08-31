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
  const [targetSum, setTargetSum] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.TARGET)) || 100000);
  const [progress, setProgress] = useState(() => Number(localStorage.getItem(STORAGE_KEYS.PROGRESS)) || 25000);
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTRIES) || "[]"));

  useEffect(() => localStorage.setItem(STORAGE_KEYS.TARGET, String(targetSum)), [targetSum]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.PROGRESS, String(progress)), [progress]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries)), [entries]);

  const percent = Math.min(100, targetSum === 0 ? 0 : Math.round((progress / targetSum) * 10000) / 100);

  const [knobValue, setKnobValue] = useState(1000);
  const knobRef = useRef(null);
  const pointerActive = useRef(false);
  const lastAngle = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editName, setEditName] = useState("");

  function addEntry(amount, partName = "") {
    const newAmount = Number(amount || 0);
    if (!newAmount) return;
    const entry = { amount: newAmount, partName: partName || null, date: new Date().toISOString() };
    setEntries((s) => [entry, ...s]);
    setProgress((p) => p + newAmount);
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('Service Worker registered.', reg))
          .catch(err => console.error('Service Worker registration failed:', err));
      });
    }
  }, []);

  return (
    <div> {/* Placeholder: full UI code should be here */} </div>
  );
}