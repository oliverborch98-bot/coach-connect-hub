import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Adapted component from the Next.js page.tsx example.
 * Note: Uses the browser client as this is a standard React component in Vite.
 */
export default function SupabaseDataTest() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name').limit(10);
      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }
      if (data) {
        setProfiles(data);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="p-4 border rounded shadow-sm bg-background">
      <h2 className="text-xl font-bold mb-4">Supabase Profiles</h2>
      <ul className="list-disc pl-5">
        {profiles?.map((profile) => (
          <li key={profile.id} className="text-muted-foreground">
            {profile.full_name || 'Anonymous User'}
          </li>
        ))}
        {profiles.length === 0 && <p className="text-sm italic">Loading or no profiles found...</p>}
      </ul>
    </div>
  );
}
