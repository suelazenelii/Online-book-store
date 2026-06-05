import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NexusLogo from './NexusLogo';
import {
  LayoutDashboard, BookOpen, PenLine, Tag, Building2, Globe, BookMarked,
  Users, MapPin, Bell, ShoppingCart, Ticket, Zap, CreditCard,
  Truck, Package, RotateCcw, FileText, Star, LogOut, KeyRound,
} from 'lucide-react';

const sections = [
  {
    label: null,
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Katalogu',
    items: [
      { to: '/admin/librat',     label: 'Librat',     icon: BookOpen    },
      { to: '/admin/autoret',    label: 'Autoret',    icon: PenLine     },
      { to: '/admin/kategorite', label: 'Kategorite', icon: Tag         },
      { to: '/admin/botuesit',   label: 'Botuesit',   icon: Building2   },
      { to: '/admin/gjuhet',     label: 'Gjuhët',     icon: Globe       },
      { to: '/admin/seria',      label: 'Seria',      icon: BookMarked  },
    ],
  },
  {
    label: 'Klientet',
    items: [
      { to: '/admin/klientet',  label: 'Klientet',  icon: Users  },
      { to: '/admin/adresat',   label: 'Adresat',   icon: MapPin },
      { to: '/admin/njoftimet', label: 'Njoftimet', icon: Bell   },
    ],
  },
  {
    label: 'Shitjet',
    items: [
      { to: '/admin/porosite',    label: 'Porosite',    icon: ShoppingCart },
      { to: '/admin/kuponat',     label: 'Kuponat',     icon: Ticket       },
      { to: '/admin/promocionet', label: 'Promocionet', icon: Zap          },
      { to: '/admin/pagesat',     label: 'Pagesat',     icon: CreditCard   },
    ],
  },
  {
    label: 'Logjistika',
    items: [
      { to: '/admin/dergesat', label: 'Dërgesat', icon: Truck      },
      { to: '/admin/stoku',    label: 'Stoku',    icon: Package    },
      { to: '/admin/kthimet',  label: 'Kthimet',  icon: RotateCcw  },
      { to: '/admin/faturat',  label: 'Faturat',  icon: FileText   },
    ],
  },
  {
    label: 'Cilësia',
    items: [
      { to: '/admin/vleresimet', label: 'Vlerësimet', icon: Star },
    ],
  },
  {
    label: 'Llogaria',
    items: [
      { to: '/admin/change-password', label: 'Ndrysho Fjalëk.', icon: KeyRound },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2.5 group">
            <NexusLogo size={30} className="transition-transform duration-200 group-hover:scale-110" />
            <div>
              <div className="text-sm font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">UBT</span>
                <span className="text-white">Nexus</span>
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
          {sections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <div className="px-3 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={15} className="shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700 shrink-0">
          <div className="text-xs text-gray-400 mb-0.5 truncate">{user?.emri} {user?.mbiemri}</div>
          <div className="text-xs text-gray-500 mb-3 truncate">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            Dilni
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
