import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import CampusAssistant from './components/CampusAssistant'
import Home from './pages/Home'
import Map from './pages/Map'
import Schedule from './pages/Schedule'
import Events from './pages/Events'
import Dining from './pages/Dining'
import Transit from './pages/Transit'
import Services from './pages/Services'
import Board from './pages/Board'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/events" element={<Events />} />
            <Route path="/dining" element={<Dining />} />
            <Route path="/transit" element={<Transit />} />
            <Route path="/services" element={<Services />} />
            <Route path="/board" element={<Board />} />
          </Routes>
          <CampusAssistant />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
