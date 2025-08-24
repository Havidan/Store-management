import React from "react";
import SuppliersList from "../../SuppliersList/SuppliersList";

// כאן נשתמש ברשימת הספקים שלך, שמסוננת בצד השרת לפי עיר הבעל-מכולת
export default function StoreLinksDiscover() {
  return (
    <div>
      <h3>מצאי ספקים חדשים בעיר שלך</h3>
      <SuppliersList />
    </div>
  );
}
