import {
  FilePlus,
  Barcode,
  FileDown,
  LogOut
} from 'lucide-react';

const Sidebar = ({ currentUser, onLogout }) => (
    <aside className="sidebar">
        {/* Top Content */}
        <div>
            <flex>
            <h2 className="section_link">Welcome to Excel Creator, {currentUser}</h2>
            <p className="section_link">
                Submit data or upload JSON. Download your <strong>approved</strong> reports anytime.
            </p>

            <nav>
                <ul className="nav content">
                    <li>
                        <a className="section_link"
                        href="#submit"
                        >
                        <FilePlus className="icon_divider" />
                        <span>Submit Data</span>
                        </a>
                    </li>

                    <li>
                        <a className="section_link"
                        href="#barcode"
                        >
                        <Barcode className="icon_divider" />
                        <span>Generate Barcode</span>
                        </a>
                    </li>

                    <li>
                        <a className="section_link"
                        href="#excel"
                        >
                        <FileDown className="icon_divider" />
                        <span>Download Excel</span>
                        </a>
                    </li>
                </ul>
            </nav>

            {/* Logout */}
            <div className="box_divider1">
                <button className="btn hologram"
                onClick={onLogout}>
                    <LogOut className="w-5 h-5" />
                    <span data-text="Logout">Logout</span>
                    <div className="scan-line"></div>
                </button>
            </div>

            </flex>
        </div>

        
    </aside>
);

export default Sidebar;
