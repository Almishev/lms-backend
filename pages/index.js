import Layout from "@/components/Layout";
import {useSession, signOut} from "next-auth/react";
import {useEffect, useState} from "react";
import axios from "axios";

export default function Home() {
  const {data: session, status} = useSession();
  const [stats,setStats] = useState(null);
  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data));
  }, []);
  
  if (status === "loading") {
    return <Layout>
      <div className="text-center">
        <h2>Зареждане...</h2>
      </div>
    </Layout>
  }
  
  return <Layout>
    <div className="text-blue-900 flex justify-between">
      <h2>
        Здравей, <b>{session?.user?.name}</b>
      </h2>
      <div className="flex bg-gray-300 gap-1 text-black rounded-lg overflow-hidden">
        <img src={session?.user?.image} alt="" className="w-6 h-6"/>
        <span className="px-2">
          {session?.user?.name}
        </span>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm">Общо книги</div>
        <div className="text-3xl font-bold">{stats?.books.total ?? '-'}</div>
        <div className="text-xs text-gray-400 mt-1">всички книги в каталога</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm">Налични книги</div>
        <div className="text-3xl font-bold">{stats?.books.available ?? '-'}</div>
        <div className="text-xs text-gray-400 mt-1">книги налични за заемане</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-500 text-sm">Недостъпни книги</div>
        <div className="text-3xl font-bold">{stats?.books.unavailable ?? '-'}</div>
        <div className="text-xs text-gray-400 mt-1">книги в момента заети</div>
      </div>
    </div>
    <div className="mt-6 p-4 bg-gray-100 rounded">
      <p><strong>Имейл:</strong> {session?.user?.email}</p>
      <button onClick={() => signOut()} className="btn-red mt-2">Изход</button>
    </div>
  </Layout>
}
