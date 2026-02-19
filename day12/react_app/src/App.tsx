import './App.css';
import Counter  from '../components/counter';
//import {ColorChange} from "../components/ColorChange";
import React from 'react';

function App() {
 // const [theme, setTheme] = React.useState(0);
 // const[emoji, setEmoji] = React.useState('☀️');
  
  return (

  //   <div className="app-container" data-theme={theme}>
  //     {/* <ColorChange theme={theme} setTheme={setTheme} emoji={emoji} setEmoji={setEmoji} />
  //     <h1>Hi there, Bunny!!</h1>
  //     <h2>{emoji}</h2>
      
  //     <p style={{
  //       fontSize: '1.2rem',
  //       position: 'absolute',
  //       bottom: '10px',
  //       left: '50%',
  //       transform: 'translateX(-50%)',
  //       color: theme === 0 ? 'black' : 'white',
  //       fontWeight: "bold"
  //     }}>{theme ? 'Come to your Dark Side......' : 'Bhaago mc, bhoot bhenchod !!!!!!!  lode ka dark side'}</p> */}
   
  //   </div>

  <div className="app-container">
    
    <Counter />
  </div>
  );
}

export default App