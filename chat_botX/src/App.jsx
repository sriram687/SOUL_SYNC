import React from 'react'
import {BrowserRouter as Router,Route,Routes} from "react-router-dom"
import Home from "./components/Home";
import Chat from "./components/Chat";
import Register from "./components/Register";
import Login from "./components/Login"
import Resources from "./components/Resources";
import About from "./components/About";
import Doctor from "./components/Doctor";
import Calender from './components/Calender.jsx';
import Details from './components/Details.jsx';
import Nutrition from './Nutrition/Nutrition.jsx';


function App(){
  return (
    <Router>
      <Routes>
      <Route path='/about' element={<About/>}/>
      <Route path='/' element={<Home/>}/>
      <Route path='/chat' element={<Chat/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path="/resources" element={<Resources />} />
      <Route path="/doctor" element={<Doctor />} />
      <Route path="/calender" element={<Calender/>}/>
      <Route path="/details" element={<Details/>}/>
      <Route path="/nutrition" element={<Nutrition/>}/>
      </Routes>
    </Router>
  )
}

export default App