import {
  FilePlus,
  Barcode,
  FileDown,
  LogOut
} from 'lucide-react';

const Sidebar = ({ currentUser, onLogout }) => (
    <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-blue-500 to-purple-100 border-r border-blue-200 shadow-md p-6 flex justify-between h-full">
        {/* Top Content */}
        <div className="content">
            <flex>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to Excel Creator, {currentUser}</h2>
            <p className="text-sm text-gray-700 mb-6">
                Submit data or upload JSON. Download your <strong>approved</strong> reports anytime.
            </p>

            <ul className='flex flex-col mt-5 text-xl'>
                <nav className="space-y-4">
                    <li>
                        <a
                        href="#submit"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-800 hover:bg-purple-200 transition"
                        >
                        <FilePlus className="w-5 h-5 text-purple-600" />
                        <span>Submit Data</span>
                        </a>
                    </li>

                    <li>
                        <a
                        href="#barcode"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-800 hover:bg-purple-200 transition"
                        >
                        <Barcode className="w-5 h-5 text-purple-600" />
                        <span>Generate Barcode</span>
                        </a>
                    </li>

                    <li>
                        <a
                        href="#excel"
                        className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-800 hover:bg-purple-200 transition"
                        >
                        <FileDown className="w-5 h-5 text-purple-600" />
                        <span>Download Excel</span>
                        </a>
                    </li>
                </nav>
            </ul>
            </flex>
        </div>

        {/* Logout */}
        <div className="box_divider1">
            <button class="btn hologram"
            onClick={onLogout}>
                <LogOut className="w-5 h-5" />
                <span data-text="Logout">Logout</span>
                <div class="scan-line"></div>
            </button>
        </div>
    </aside>
);

export default Sidebar;
