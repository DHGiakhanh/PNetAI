import {
  Home,
  PawPrint,
  HeartPulse,
  Users,
  ShoppingBag,
  Search,
  Bell,
  Plus,
  Camera,
  ChevronRight,
  Settings
} from "lucide-react";
import ToggleSwitch from "../../../components/common/ToggleSwitch";


export default function UserProfile() {
  return (
    <div className="flex bg-[#f6f7fb] min-h-screen">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#fdeff3] p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-pink-500 font-bold text-xl mb-10">
            PNetAI
          </h1>

          <nav className="space-y-6 text-gray-500">

            <div className="flex items-center gap-3 hover:text-pink-500 cursor-pointer">
              <Home size={18}/> Home
            </div>

            <div className="flex items-center gap-3 hover:text-pink-500 cursor-pointer">
              <PawPrint size={18}/> My Pets
            </div>

            <div className="flex items-center gap-3 hover:text-pink-500 cursor-pointer">
              <HeartPulse size={18}/> Health
            </div>

            <div className="flex items-center gap-3 hover:text-pink-500 cursor-pointer">
              <Users size={18}/> Community
            </div>

            <div className="flex items-center gap-3 hover:text-pink-500 cursor-pointer">
              <ShoppingBag size={18}/> Shop
            </div>

          </nav>
        </div>

        {/* user mini card */}
        <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm border">

          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            className="w-10 h-10 rounded-full"
          />

          <div className="flex-1">
            <p className="text-sm font-semibold">Sarah J.</p>
            <p className="text-xs text-gray-400">Pet Parent</p>
          </div>

          <Settings size={16} className="text-gray-400"/>
        </div>

      </aside>


      {/* MAIN */}
      <div className="flex-1 p-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-3xl font-semibold">My Profile</h1>
            <p className="text-gray-400">
              Manage your personal information and preferences.
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Search size={18}/>
            </div>

            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Bell size={18}/>
            </div>

            <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-sm">
              <Plus size={18}/>
            </div>

          </div>

        </div>


        <div className="grid grid-cols-3 gap-6">

          {/* LEFT CONTENT */}
          <div className="col-span-2 space-y-6">

            {/* PROFILE CARD */}
            <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-5">

              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                className="w-16 h-16 rounded-full"
              />

              <div className="flex-1">
                <h2 className="font-semibold text-lg">
                  Sarah Jenkins
                </h2>

                <p className="text-gray-400 text-sm">
                  Pet Parent since October 2023
                </p>
              </div>

              <button className="flex items-center gap-2 border px-4 py-2 rounded-full text-sm">
                <Camera size={16}/> Change Photo
              </button>

              <button className="text-red-400 text-sm">
                Remove
              </button>

            </div>


            {/* PERSONAL INFO */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">

              <div className="flex justify-between mb-6">

                <h3 className="font-semibold text-lg">
                  Personal Information
                </h3>

                <button className="bg-gray-700 text-white px-4 py-2 rounded-full text-sm">
                  Change
                </button>

              </div>


              <div className="grid grid-cols-2 gap-5">

                <input
                  className="border rounded-xl p-3"
                  defaultValue="Sarah"
                />

                <input
                  className="border rounded-xl p-3"
                  defaultValue="Jenkins"
                />

                <input
                  className="border rounded-xl p-3 col-span-2"
                  defaultValue="sarah.jenkins@example.com"
                />

                <input
                  className="border rounded-xl p-3"
                  defaultValue="+1 (555) 123-4567"
                />

                <input
                  className="border rounded-xl p-3"
                  defaultValue="San Francisco, CA"
                />

              </div>


              {/* sale code */}
              <div className="mt-6">

                <p className="text-sm mb-2">
                  Linked Sale Code (Optional)
                </p>

                <input
                  className="border rounded-xl p-3 w-full bg-[#f7f1ed]"
                  defaultValue="SC-4921-X"
                />

                <p className="text-xs text-gray-400 mt-2">
                  This code connects you with a dedicated PNetAI representative for exclusive offers and support.
                </p>

              </div>


              {/* password */}
              <div className="mt-8">

                <div className="flex justify-between mb-2">

                  <p className="font-medium">Password</p>

                  <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">
                    Hidden by default
                  </span>

                </div>

                <p className="text-sm text-gray-400 mb-4">
                  Only show the password form after the user chooses to change it.
                </p>

                <button className="border px-4 py-2 rounded-full text-sm">
                  Change Password
                </button>

              </div>

            </div>

          </div>


          {/* RIGHT PANEL */}
          <div className="space-y-6">

            {/* FAMILY MEMBERS */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">

              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">
                  Family Members
                </h3>

                <Plus size={16}/>
              </div>


              <div className="space-y-4">

                <div className="flex items-center justify-between p-3 border rounded-xl">

                  <div className="flex items-center gap-3">

                    <img
                      src="https://images.unsplash.com/photo-1517849845537-4d257902454a"
                      className="w-10 h-10 rounded-lg object-cover"
                    />

                    <div>
                      <p className="font-medium text-sm">
                        Bella
                      </p>
                      <p className="text-xs text-gray-400">
                        Golden Retriever
                      </p>
                    </div>

                  </div>

                  <ChevronRight size={16}/>
                </div>


                <div className="flex items-center justify-between p-3 border rounded-xl">

                  <div className="flex items-center gap-3">

                    <img
                      src="https://images.unsplash.com/photo-1518791841217-8f162f1e1131"
                      className="w-10 h-10 rounded-lg object-cover"
                    />

                    <div>
                      <p className="font-medium text-sm">
                        Mochi
                      </p>
                      <p className="text-xs text-gray-400">
                        Scottish Fold
                      </p>
                    </div>

                  </div>

                  <ChevronRight size={16}/>
                </div>

              </div>

            </div>


            {/* PREFERENCES */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">

              <h3 className="font-semibold mb-4">
                Preferences
              </h3>

              <div className="space-y-5">

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-400">
                      Health updates and reminders
                    </p>
                  </div>

                  <ToggleSwitch defaultOn />
                </div>


                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      SMS Alerts
                    </p>
                    <p className="text-xs text-gray-400">
                      For vet appointments
                    </p>
                  </div>

                  <ToggleSwitch />
                </div>


                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      Community Visibility
                    </p>
                    <p className="text-xs text-gray-400">
                      Show profile to other owners
                    </p>
                  </div>

                  <ToggleSwitch defaultOn />
                </div>

              </div>

            </div>


            {/* DANGER ZONE */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">

              <h3 className="text-red-500 font-semibold mb-2">
                Danger Zone
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                Permanently delete your account and all associated pet records from PetEcho.
              </p>

              <button className="border border-red-300 text-red-500 px-4 py-2 rounded-full">
                Delete Account
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}