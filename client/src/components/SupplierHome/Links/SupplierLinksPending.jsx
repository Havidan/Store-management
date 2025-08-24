import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SupplierLinksPending() {
  const supplierId = localStorage.getItem("userId");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    if (!supplierId) return;
    try {
      setError("");
      const res = await axios.get("http://localhost:3000/links/mine", {
        params: { role: "Supplier", status: "pending", supplierId },
      });
      setRows(res.data || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load pending requests");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  const decide = async (owner_id, decision) => {
    try {
      setBusy(owner_id);
      setError("");
      const res = await axios.post("http://localhost:3000/links/decision", {
        supplierId,
        ownerId: owner_id,
        decision, // "APPROVE" | "REJECT"
      });
      if (res.status >= 200 && res.status < 300) {
        // מסירים מהרשימה לאחר שינוי סטטוס
        setRows((prev) => prev.filter((r) => r.owner_id !== owner_id));
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update request");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-4">בקשות חיבור שממתינות לאישורך</h2>

      {error && (
        <div className="mb-3 text-red-600 text-sm">{error}</div>
      )}

      {!rows.length ? (
        <div className="text-gray-500">אין בקשות ממתינות כרגע.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {rows.map((r) => (
            <li key={r.owner_id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.company_name}</div>
                <div className="text-sm text-gray-500">{r.contact_name} · {r.phone}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-60"
                  onClick={() => decide(r.owner_id, "APPROVE")}
                  disabled={busy === r.owner_id}
                >
                  אשר
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-60"
                  onClick={() => decide(r.owner_id, "REJECT")}
                  disabled={busy === r.owner_id}
                >
                  דחה
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
