import React from 'react'

const Counter = () => {

    const [count, setCount] = React.useState(0);
    const[isRunning, setIsRunning] = React.useState(false);

    React.useEffect (() => {
        if(!isRunning) return;
        const interval = setInterval(() => {
            setCount(prev => prev + 1);
        }, 800);
        return () => clearInterval(interval);
    }, [isRunning])
  return (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px'
    }}>
        <h1>Auto Counter</h1>
      <h2>{count}</h2>
      <button onClick={() => setIsRunning(!isRunning)}>
        {isRunning ? "Stop" : "Start"}
      </button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  )
}

export default Counter
