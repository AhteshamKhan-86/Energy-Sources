import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import powerData from './powerData.json';

export default function App() {
  const [activeSector, setActiveSector] = useState("WELCOME");
  const [isConnected, setIsConnected] = useState(false);
  const isWelcome = activeSector === "WELCOME";
  const isHydro = activeSector === "HYDRO";

  // 🔌 WEB SERIAL API FUNCTION (DIRECT BROWSER TO ARDUINO - NO NODE SERVER REQUIRED)
  const connectArduino = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setIsConnected(true);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }

        if (value) {
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Hold incomplete trailing line in buffer

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("SW:")) {
              const switchNum = parseInt(cleanLine.split(":")[1]);
              
              const sectorMapping = {
                1: "WELCOME",
                2: "THERMAL",
                3: "HYDRO",
                4: "NUCLEAR",
                5: "RENEWABLE",
                6: "GAS"
              };

              const targetSector = sectorMapping[switchNum];
              if (targetSector) {
                setActiveSector(targetSector);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Serial Connection Error:", err);
      setIsConnected(false);
    }
  };

  // --- LOCAL SOCKET FALLBACK (AGAR BROWSER HARDWARE CONNECT NA HO TOH) ---
  useEffect(() => {
    const socket = io('http://localhost:5000', { autoConnect: false });
    
    if (!isConnected) {
      socket.connect();
      socket.on('sector-switch', (data) => {
        if (data && data.status === 1) {
          const sectorMapping = {
            1: "WELCOME",
            2: "THERMAL",
            3: "HYDRO",
            4: "NUCLEAR",
            5: "RENEWABLE",
            6: "GAS"
          };

          const targetSector = sectorMapping[data.switch];
          if (targetSector && (targetSector === "WELCOME" || powerData[targetSector])) {
            setActiveSector(targetSector);
          }
        }
      });
    }

    return () => {
      socket.off('sector-switch');
      socket.disconnect();
    };
  }, [isConnected]);

  // Sirf Hydro ke liye plants list ko duplicate karke continuous smooth loop diya hai
  const rawPlants = powerData[activeSector]?.plants || [];
  const displayPlants = isHydro ? [...rawPlants, ...rawPlants] : rawPlants;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a1128 0%, #101f42 40%, #0d1b3a 70%, #060b19 100%)',
      color: '#f3f4f6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justify: 'space-between',
      padding: '24px 36px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* AUTO SCROLL ANIMATION STYLES (STRICTLY SIRF HYDRO KE LIYE) */}
      <style>{`
        @keyframes hydroAutoScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .hydro-scrolling-tbody {
          display: block;
          animation: hydroAutoScroll 28s linear infinite;
        }
        .hydro-scrolling-tbody:hover {
          animation-play-state: paused;
        }
        .hydro-table-container thead, .hydro-table-container tbody tr {
          display: table;
          width: 100%;
          table-layout: fixed;
        }
      `}</style>

      {/* VIBRANT NEON GLOW LIGHTS */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.18) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '15%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.18) 0%, transparent 70%)',
        filter: 'blur(110px)',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      {/* TOP CONNECT HARDWARE BUTTON FOR DEPLOYMENT (DISAPPEARS WHEN CONNECTED) */}
      {!isConnected && (
        <button 
          onClick={connectArduino}
          style={{
            position: 'absolute',
            top: '20px',
            left: '36px',
            zIndex: 100,
            backgroundColor: 'rgba(0, 240, 255, 0.15)',
            color: '#00f0ff',
            border: '1px solid #00f0ff',
            padding: '8px 20px',
            borderRadius: '24px',
            fontSize: '1.05rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          🔌 Connect Hardware
        </button>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justify: 'space-between',
        height: '100%',
        maxHeight: '100%'
      }}>
        
        {/* TOP WELCOME HEADER (STRICTLY CENTERED DEPT + YOUR EXACT TEAM DIV) */}
        <AnimatePresence>
          {isWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                width: '100%',
                paddingTop: '8px',
                zIndex: 25,
                position: 'relative'
              }}
            >
              {/* STRICTLY CENTERED DEPARTMENT TITLE */}
              <div style={{
                fontSize: '2.75rem',
                fontWeight: '800',
                letterSpacing: '1.5px',
                color: '#34bbd9',
                textTransform: 'uppercase',
                textAlign: 'center',
                width: '100%',
                filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.4))'
              }}>
                DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING
              </div>

              {/* AAPKA APNA TEAM MEMBERS DIV (EXACT POSITION & SCALED) */}
              <div style={{
                position: 'absolute',
                top: "500px",
                right: '0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'start',
                fontSize: '1.65rem',
                color: '#cbd5e1'
              }}>
                <span style={{ color: '#21c766', fontWeight: '800', letterSpacing: '1.5px', fontSize: '1.75rem' }}>
                  TEAM MEMBERS
                </span>
                <span style={{ color: '#ffffff', fontWeight: '700' }}>Ahtesham Khan</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>R.S Ravi</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Rahul</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DYNAMIC HEADER */}
        <motion.div 
          animate={{
            marginTop: isWelcome ? '2vh' : '0px',
            marginBottom: isWelcome ? '0px' : '10px',
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', zIndex: 20, flexShrink: 0 }}
        >
          <motion.h1 
            animate={{ fontSize: isWelcome ? '2.7rem' : '1.6rem' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ 
              background: 'linear-gradient(90deg, #00f0ff, #38bdf8, #00ff88)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0, 
              letterSpacing: '3px', 
              fontWeight: '1000',
              textTransform: 'uppercase',
              filter: 'drop-shadow(0 0 18px rgba(0, 255, 166, 0.35))'
            }}
          >
            TAMIL NADU SMART ENERGY GRID SYSTEM
          </motion.h1>
        </motion.div>

        {/* CENTER CONTENT */}
        <div style={{ 
          display: 'flex', 
          justify: 'center', 
          alignItems: 'center',
          flexGrow: 1,
          width: '100%',
          overflow: 'hidden'
        }}>
          <AnimatePresence mode="wait">
            
            {/* 1. WELCOME SCREEN */}
            {isWelcome && (
              <motion.div 
                key="welcome-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ 
                  textAlign: 'center', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justify: 'center',
                  width: '100%'
                }}
              >
                <h2 style={{ 
                  fontSize: '8.25rem', 
                  fontWeight: '900',
                  letterSpacing: '18px',
                  margin: '0',
                  lineHeight: '1',
                  color: '#ffffff',
                  textShadow: '0 0 0px #c4dbdc, 0 0 60px rgba(127, 156, 158, 0.6), 0 0 120px rgba(56, 189, 248, 0.4)',
                  WebkitBackgroundClip: 'unset',
                  WebkitTextFillColor: '#ffffff'
                }}>
                  WELCOME
                </h2>
              </motion.div>
            )}

            {/* 2. LIVE DATA TABLES */}
            {!isWelcome && powerData[activeSector] && (
              <motion.div 
                key={activeSector}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  width: '100%', 
                  maxWidth: '1600px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxHeight: '100%'
                }}
              >
                
                {/* Header Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', width: '100%', flexShrink: 0 }}
                >
                  <h2 style={{ fontSize: '1.45rem', color: '#ffffff', margin: 0, fontWeight: '800', letterSpacing: '0.8px' }}>
                    {powerData[activeSector].title}
                  </h2>
                  <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.12)', padding: '4px 16px', border: '1px solid #00f0ff', borderRadius: '6px', boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)' }}>
                    <span style={{ color: '#94a3b8', fontSize: '1.02rem', fontWeight: '700' }}>TOTAL: </span>
                    <strong style={{ color: '#00f0ff', fontSize: '1.25rem', fontWeight: '800' }}>{powerData[activeSector].totalCapacity}</strong>
                  </div>
                </motion.div>

                {/* Cyberpunk Compact Table Container */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ 
                    borderRadius: '14px', 
                    border: '1.5px solid rgba(0, 240, 255, 0.35)', 
                    backgroundColor: 'rgba(10, 23, 50, 0.85)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 8px 30px rgba(0, 240, 255, 0.15)',
                    overflow: 'hidden',
                    maxHeight: isHydro ? '570px' : 'none'
                  }}
                >
                  <table className={isHydro ? "hydro-table-container" : ""} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '1.05rem' }}>
                    <thead style={{
                      position: 'relative',
                      zIndex: 10,
                      backgroundColor: '#070f22',
                      borderBottom: '1.5px solid rgba(0, 240, 255, 0.4)',
                      boxShadow: '0 6px 18px rgba(0, 0, 0, 0.8)'
                    }}>
                      <tr style={{ backgroundColor: '#070f22', color: '#00f0ff' }}>
                        <th style={{ padding: '10px 16px', fontWeight: '700', fontSize: '0.98rem', letterSpacing: '0.8px', backgroundColor: '#070f22' }}>PLANT / SYSTEM IDENTIFIER</th>
                        <th style={{ padding: '10px 16px', fontWeight: '700', fontSize: '0.98rem', letterSpacing: '0.8px', width: '180px', backgroundColor: '#070f22' }}>POWER CAPACITY</th>
                        <th style={{ padding: '10px 16px', fontWeight: '700', fontSize: '0.98rem', letterSpacing: '0.8px', backgroundColor: '#070f22' }}>GRID LOGISTICS DETAILS</th>
                      </tr>
                    </thead>
                    <tbody className={isHydro ? "hydro-scrolling-tbody" : ""}>
                      {displayPlants.map((plant, index) => (
                        <tr 
                          key={index} 
                          style={{ 
                            borderBottom: '1px solid rgba(0, 240, 255, 0.08)', 
                            backgroundColor: index % 2 === 0 ? 'rgba(20, 40, 80, 0.35)' : 'transparent' 
                          }}
                        >
                          <td style={{ padding: '8px 16px', fontWeight: '600', color: '#ffffff', lineHeight: '1.25' }}>{plant.name}</td>
                          <td style={{ padding: '8px 16px', color: '#00ff88', fontWeight: '800', lineHeight: '1.25', width: '180px' }}>{plant.capacity}</td>
                          <td style={{ padding: '8px 16px', color: '#cbd5e1', lineHeight: '1.25' }}>{plant.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}