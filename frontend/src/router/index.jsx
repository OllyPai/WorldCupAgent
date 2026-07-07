import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import QueryPage from "../pages/QueryPage";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/query" element={<QueryPage />} />
    </Routes>
  );
}

export default AppRouter;
