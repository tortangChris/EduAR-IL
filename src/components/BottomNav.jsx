import { NavLink } from "react-router-dom";
import { Home, BookOpen, Camera, Bell, Settings } from "lucide-react"; // Imported Bell icon for notifications

const BottomNav = () => {
  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/modules", label: "Modules", icon: BookOpen },
    { to: "/notification", label: "Notification", icon: Bell },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-base-100 border-t border-base-300 z-50 flex items-center justify-between py-2 px-4 shadow-xl rounded-3xl">
      <div className="flex-1 flex justify-around items-center">
        {navItems.slice(0, 2).map(({ to, label, icon: Icon }, index) => (
          <NavLink
            key={index}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                isActive ? "text-primary font-semibold" : "text-gray-500"
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* <NavLink
        to="/armode"
        className={({ isActive }) =>
          `relative flex justify-center items-center w-12 h-12 rounded-full bg-primary text-white shadow-lg transition-all duration-300 ${
            isActive ? "scale-110" : "scale-100"
          }`
        }
      >
        <Camera className="w-6 h-6" strokeWidth={2.5} />
      </NavLink> */}

      <div className="flex-1 flex justify-around items-center">
        {navItems.slice(2).map(({ to, label, icon: Icon }, index) => (
          <NavLink
            key={index + 2}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                isActive ? "text-primary font-semibold" : "text-gray-500"
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
            <span className="mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
