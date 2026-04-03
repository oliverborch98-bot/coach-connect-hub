import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Adapted component from the Next.js page.tsx example.
 * Note: Uses the browser client as this is a standard React component in Vite.
 */
export default function SupabaseDataTest() {
  const [todos, setTodos] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchTodos = async () => {
      const { data } = await supabase.from('todos').select();
      if (data) {
        setTodos(data);
      }
    };
    fetchTodos();
  }, []);

  return (
    <div className="p-4 border rounded shadow-sm bg-background">
      <h2 className="text-xl font-bold mb-4">Supabase Todos</h2>
      <ul className="list-disc pl-5">
        {todos?.map((todo) => (
          <li key={todo.id} className="text-muted-foreground">
            {todo.name}
          </li>
        ))}
        {todos.length === 0 && <p className="text-sm italic">Loading or no todos found...</p>}
      </ul>
    </div>
  );
}
