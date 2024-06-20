import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [tempo, setTempo] = useState(120);
  const [display, setDisplay] = useState(false);
  const [blink, setBlink] = useState(false);
  const [beats, setBeats] = useState(0);

  const [logs, setLogs] = useState([]);
  const [feedbackColor, setFeedbackColor] = useState("perfect");

  const [accuracyCount, setAccuracyCount] = useState(1);
  const [accuracy, setAccuracy] = useState(100);
  // const[logs, setLogs] = useState(["tap", "tap"]);
  const [rawAccuracy, setRawAccuracy] = useState(100);
  const [markerPos, setMarkerPos] = useState(50);

  const tempoRef = useRef(tempo);
  const logRef = useRef(logs);
  const accuracyRef = useRef(accuracy);
  const accCountRef = useRef(accuracyCount);

  

  useEffect(() => {
    accuracyRef.current = accuracy;
  }, [accuracy])
  useEffect(() => {
    accCountRef.current = accuracyCount;
  }, [accuracyCount])
  useEffect(() => {
    logRef.current = logs;
  }, [logs])

  const useMilliseconds = (tempo) => {
    const [milli, setMilli] = useState(0);
    const startTimeRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    useEffect(() => {
      const startTime = performance.now();
      startTimeRef.current = startTime;
      setMilli(0);
      
      const update = () => {
        const currentTime = performance.now();
        setMilli(Math.floor(currentTime - startTime));
        animationFrameRef.current = requestAnimationFrame(update);
      };
  
      animationFrameRef.current = requestAnimationFrame(update);
  
      return () => cancelAnimationFrame(animationFrameRef.current);
    }, [tempo]);
  
    return milli;
  };

  const milliseconds = useMilliseconds(tempo);
  const milliRef = useRef(milliseconds);
  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo])
  useEffect(() => {
    milliRef.current = milliseconds;
  }, [milliseconds])
  
  const calculateAvg = (percentage, count) => {
    let avg = ((accuracyRef.current * (count - 1)) + percentage) / (count);
    return Math.floor(avg*100) / 100;
  }
  const detectRange = (time) => {
    setAccuracyCount(accCountRef.current + 1);
    setRawAccuracy(prevRaw => {
      let perfectTemp = (60000 / tempoRef.current); // 500 // 250 - 250 / 250
      let half = Math.floor(perfectTemp / 2);
      return calculateAvg((((half - time)/half)*100), accCountRef.current);
    })
    // 500 / -250, 250 --- (250 - 250) / 250
    if (time <= 50) {
      setFeedbackColor("perfect");
      setAccuracy(calculateAvg(100, accCountRef.current));
      return "Perfect"}
    else if (time <= 150) {
      setFeedbackColor("good");
      setAccuracy(calculateAvg(80, accCountRef.current));
      return "Good"}
    else if (time <= 300){
      setFeedbackColor("okay");
      setAccuracy(calculateAvg(50, accCountRef.current));
      return "Okay"}
    else {
      setFeedbackColor("fail");
      setAccuracy(calculateAvg(0, accCountRef.current));

      return "Fail"
    }
  }

  const feedback = (time) => { // Change in Marker Pos also here
    // milliRef.current % (60000 / tempo); // 490 - 500 10
    // setAccuracyCount(accCountRef.current + 1);
    let perfectTemp = (60000 / tempoRef.current);
    let half = Math.floor(perfectTemp / 2);
    //Pos, Else Neg 
    if ((time < half)){ // Negative = Late
      let str = detectRange(time);
      str += (' {Late ' + time + ' ms}');
      // console.log(time, half);
      setMarkerPos(() => {
        return (50 + (time/half*50));
      })
      return str;
    } else {
      let earlyVal = Math.abs(time - perfectTemp); 
      let str = detectRange(earlyVal);
      setMarkerPos(() => {
        return ((Math.abs(earlyVal - half))/half*50);

      })
      str += (" {Early " + earlyVal + ' ms}');
      return str;
    }
  }

  const getColor = (log) => {
    if (log.includes("Perfect")){
      return "perfect";
    } else if (log.includes("Good")){
      return "good";
    } else if (log.includes("Okay")) {
      return "okay";
    } else {
      return "fail";
    }
  }
  const detectKeyDown = (e) => { 
    if (e.key == fKeyRef.current || e.key == sKeyRef.current){
      setBlink(true);
      let tappedTime = (milliRef.current % (60000 / tempoRef.current));
      
      setLogs(prevLogs => {
        // const newLog = `Tapped at ${tappedTime} ms {${feedback(tappedTime)}`;
        
        const newLog = `${feedback(tappedTime)}`
        if (prevLogs.length > 10){
          return [newLog, ...prevLogs.slice(0, -1)];
        } else {
          return [newLog, ...prevLogs];
        }
      });
      setTimeout(() => {
        setBlink(false);
      }, 100)
    } 
  };

  //KeyDown
  useEffect(() => {
    document.addEventListener('keydown', detectKeyDown, true);
    return () => {
      window.removeEventListener('keydown', detectKeyDown);
    };
  }, [])

  //Log Clearance
  useEffect(() => {
    const interval = setInterval(() =>{
      if (logs.length > 0){
        setLogs(prevLogs => {
          const newLogs = [...prevLogs];
          newLogs.pop();
          return newLogs;
        })
      }
    }, 450)
    return () => clearInterval(interval);
  }, [logs]);

  useEffect(() => {
    const myInterval = setInterval(() => {
      setDisplay(true);
      setTimeout(() => {
        setDisplay(false);
      }, 115)
    }, 1000 * (60 / tempo))
    return () => clearInterval(myInterval);
  }, [tempo]);

  const [firstKeybind, setFirstKeybind] = useState("z");
  const [secondKeybind, setSecondKeybind] = useState("x");
  const [isListening, setIsListening] = useState(false);
  const [listen2, setListen2] = useState(false);
  const fKeyRef = useRef(firstKeybind);
  const sKeyRef = useRef(secondKeybind);
  useEffect(() =>{
    fKeyRef.current = firstKeybind;
  }, [firstKeybind])
  useEffect(() => {
    sKeyRef.current = secondKeybind;
  }, [secondKeybind])

  const handlePress = () => {
    setBlink(true);
    setLogs(prevLogs => [`Tapped at ${milliseconds} ms`,...prevLogs]);
    setTimeout(() => {
      setBlink(false);
    }, 100)
  };
  
  useEffect(() => {
    if (isListening){
      document.addEventListener("keydown", listenForKey, true);
      return () => {
        document.removeEventListener('keydown', listenForKey, true);
      }
    }
    if (listen2){
      document.addEventListener('keydown', listenForKey2, true);
      return () => {
        document.removeEventListener('keydown', listenForKey2, true);
      }
    }
  }, [isListening, listen2])

  const listenForKey = (e) => {
    setFirstKeybind(e.key);
    setIsListening(false);
  }
  const listenForKey2 = (e) => {
    setSecondKeybind(e.key);
    setListen2(false);
  }

  const handleChangeKeybind = () => {
    setIsListening(true);
  }
  const handleChangeKeybind2 = () => {
    setListen2(true);
  }
  const getMarkerPos = (pos) => {
    return String(pos) + '%';
  }
  const refreshAcc = () => {
    setAccuracy(100);
    setRawAccuracy(100);
    setAccuracyCount(1);
    setMarkerPos(50);
  }

  return (
    <>
      <div className="header">
        <h1>Tempo Nurse</h1>
        <div className="header-btns">
          <button className="keybind" onClick={handleChangeKeybind}>Change Keybind</button>
          <button className="keybind" onClick={handleChangeKeybind2}>Add Second Keybind (Optional)</button>
        </div>
      </div>
      <div className={(isListening || listen2) ? 'overlay' : 'hide-overlay'}>
        <p>PRESS A KEY</p>
      </div>

      <div className="tempo-setter">
        <button onClick={() => setTempo(prev => prev - 1)}>-</button>
        <h1>Current Tempo: <em><input  style={{ textAlign: 'center', width: '50px', height: '25px', fontSize: '.75em'}}value={tempo} onChange={(e) => setTempo(isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}></input> bpm</em></h1>
        <button onClick={() => setTempo(prev => prev + 1)}>+</button>
      </div>
      <h1 className="description">Tap to the Tempo!</h1> <button className={(display && (tempo!= 0)) ? "blink-display blink-display-active" : "blink-display"}></button>
      <div className='acc-display'>
        <h1 className="accuracy">Accuracy: {accuracy}%</h1> <img onClick={refreshAcc} className='refresh' src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Refresh_icon.svg"></img>
      </div>
      <h2 className="raw-accuracy">Raw Acc: {rawAccuracy}%</h2>

      <div className="time-feedback">
        <div className="number-line">
          <div className="early-marker">
            <p className="early-text">Early</p>
          </div>
          <div className="marker" style={{left: getMarkerPos(markerPos)}}>  </div>
          <div className='late-marker'>
            <p className="late-text">Late</p>
          </div>
          <div className='perfect-marker'>
            <p className="perfect-text">Perfect</p>
          </div>
        </div>
      </div>
      <button className={blink ? "space activated" : "space"} onClick={handlePress}>Press Space</button>
      <ul className="logList">
        {
          logs.map((log, index) => (
            <li className={getColor(log)} key={index}>{log}</li>
          ))
        }
      </ul>
      {/* <p className="disclaimer">**DISCLAIMER THIS PRODUCT IS NOT FOR SAIL YET SO CALM YOURE BOOTY</p> */}
    </>
  )
}

export default App
