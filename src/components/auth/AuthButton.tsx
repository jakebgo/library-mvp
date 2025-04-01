'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/auth-helpers-nextjs';

export default function AuthButton({ session }: { session: Session | null }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/auth');
  };

  return (
    <button
      className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
      onClick={handleSignOut}
    >
      Sign Out
    </button>
  );
} 