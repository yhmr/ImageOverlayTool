import React from "react";
import ReactDOM from "react-dom/client";
import logo from "@assets/icon.png";
import "./Splash.css";

const Splash = () => {
    return (
        <div className="splash-container">
            <div className="splash-content">
                <img src={logo} alt="Logo" className="splash-logo" />
                <h1 className="splash-title">ImageOverlayTool</h1>
                <div className="splash-status">
                    <span className="splash-status-dot"></span>
                    <span className="splash-status-text">Initializing...</span>
                </div>
            </div>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Splash />
    </React.StrictMode>
);
