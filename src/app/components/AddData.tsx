import { useState } from "react";
import { supabase, checkSupabaseEnv } from "../lib/supabase";

export default function AddData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddData = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Optional: Check env on first run
      checkSupabaseEnv();

      const { data, error } = await supabase
        .from("your_table_name")   // ← Change this
        .insert([
          {
            column1: "value1",
            column2: "value2",
            // add your columns here
          },
        ])
        .select();

      if (error) {
        console.error("Supabase Insert Error:", error);
        setMessage(`Error: ${error.message}`);
      } else {
        console.log("✅ Insert successful:", data);
        setMessage("Data added successfully!");
      }
    } catch (err: any) {
      console.error("Caught Error:", err);
      setMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAddData} disabled={loading}>
        {loading ? "Adding..." : "Add Data"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}