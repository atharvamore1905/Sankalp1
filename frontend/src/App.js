import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import Home from "./pages/Home";
import Jigyasa from "./pages/Jigyasa";
import CollegeDetail from "./pages/CollegeDetail";
import SkillDetail from "./pages/SkillDetail";
import JobDetail from "./pages/JobDetail";
import Margadarshak from "./pages/Margadarshak";
import Samarthya from "./pages/Samarthya";
import Drishtikon from "./pages/Drishtikon";
import Sahyog from "./pages/Sahyog";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jigyasa" element={<Jigyasa />} />
          <Route path="/jigyasa/college/:id" element={<CollegeDetail />} />
          <Route path="/jigyasa/skill/:id" element={<SkillDetail />} />
          <Route path="/jigyasa/job/:id" element={<JobDetail />} />
          <Route path="/margadarshak" element={<Margadarshak />} />
          <Route path="/samarthya" element={<Samarthya />} />
          <Route path="/drishtikon" element={<Drishtikon />} />
          <Route path="/sahyog" element={<Sahyog />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;