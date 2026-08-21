import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import BerlinPage from "./pages/BerlinPage.jsx";
import DetailPage from "./pages/DetailPage.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/berlin" element={<BerlinPage />} />
      <Route path="/detail/:pageId" element={<DetailPage />} />
    </Routes>
  </BrowserRouter>,
);
