import React, { useEffect, useState } from "react";
import axios from "axios";

// חדשים
import { useAuth } from "../../../auth/AuthContext";
import api from "../../../api/axios";

export default function SupplierLinksActive() {
  const supplierId = localStorage.getItem("userId");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  const { USE_SESSION_AUTH } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        setError("");
        if (USE_SESSION_AUTH) {
          const res = await api.get("/links/mine/session", { params: { status: "approved" } });
          setRows(res.data || []);
        } else {
          if (!supplierId) return;
          const res = await axios.get("http://localhost:3000/links/mine", {
            params: { role: "Supplier", status: "approved", supplierId },
          });
          setRows(res.data || []);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load approved links");
      }
    })();
  }, [USE_SESSION_AUTH, supplierId]);

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-xl font-semibold mb-4">בעלי מכולת מחוברים</h2>

      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

      {!rows.length ? (
        <div className="text-gray-500">אין כרגע חיבורים מאושרים.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {rows.map((r) => (
            <li key={r.owner_id} className="py-3">
              <div className="font-medium">{r.company_name}</div>
              <div className="text-sm text-gray-500">{r.contact_name} · {r.phone}</div>
              <div className="text-xs text-gray-400 mt-1">
                סטטוס: {r.status} · נוצר: {new Date(r.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
