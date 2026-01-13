import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";

export function Layout() {
    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Outlet />
            </div>
        </div>
    );
}
