import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import powerData from "./powerData.json";

export default function App() {
  const [activeSector, setActiveSector] = useState("WELCOME");
  const [isConnected, setIsConnected] = useState(false);

  const isWelcome = activeSector === "WELCOME";
  const isHydro = activeSector === "HYDRO";

  // Simple Clean Web Serial Connect Function
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
          buffer = lines.pop(); // Trailing buffer hold

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
                6: "GAS",
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

  // --- LOCAL SOCKET FALLBACK ---
  useEffect(() => {
    const socket = io("http://localhost:5000", { autoConnect: false });

    if (!isConnected) {
      socket.connect();
      socket.on("sector-switch", (data) => {
        if (data && data.status === 1) {
          const sectorMapping = {
            1: "WELCOME",
            2: "THERMAL",
            3: "HYDRO",
            4: "NUCLEAR",
            5: "RENEWABLE",
            6: "GAS",
          };

          const targetSector = sectorMapping[data.switch];
          if (
            targetSector &&
            (targetSector === "WELCOME" || powerData[targetSector])
          ) {
            setActiveSector(targetSector);
          }
        }
      });
    }

    return () => {
      socket.off("sector-switch");
      socket.disconnect();
    };
  }, [isConnected]);

  // Hydro Plants Duplication
  const rawPlants = powerData[activeSector]?.plants || [];
  const displayPlants = isHydro ? [...rawPlants, ...rawPlants] : rawPlants;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #e2e8f0 100%) !important",
        color: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        justify: "space-between",
        padding: "24px 36px",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* FORCE GLOBAL LIGHT BACKGROUND IN CSS */}
      <style>{`
        html, body, #root {
          background-color: #e0f2fe !important;
          background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 50%, #e2e8f0 100%) !important;
          color: #0f172a !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

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

      {/* LIGHT NEON GLOW EFFECTS */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "15%",
          width: "750px",
          height: "750px",
          background:
            "radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      ></div>

      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "15%",
          width: "750px",
          height: "750px",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)",
          filter: "blur(110px)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      ></div>

      {/* TOP CONNECT HARDWARE BUTTON */}
      {!isConnected && (
        <button
          onClick={connectArduino}
          style={{
            position: "absolute",
            top: "20px",
            left: "36px",
            zIndex: 100,
            backgroundColor: "#0284c7",
            color: "#ffffff",
            border: "none",
            padding: "10px 24px",
            borderRadius: "24px",
            fontSize: "1.05rem",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(2, 132, 199, 0.35)",
            backdropFilter: "blur(8px)",
          }}
        >
          🔌 Connect Hardware
        </button>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justify: "space-between",
          height: "100%",
          maxHeight: "100%",
        }}
      >
        {/* TOP WELCOME HEADER */}
        <AnimatePresence>
          {isWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{
                display: "flex",
                alignItems: "center",
                justify: "center",
                width: "100%",
                paddingTop: "8px",
                zIndex: 25,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "2.75rem",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  color: "#0284c7",
                  textTransform: "uppercase",
                  textAlign: "center",
                  width: "100%",
                  filter: "drop-shadow(0 2px 6px rgba(2, 132, 199, 0.25))",
                }}
              >
                DEPARTMENT OF ELECTRICAL AND ELECTRONICS ENGINEERING
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "510px",
                  right: "0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  fontSize: "1.65rem",
                  color: "#1e293b",
                }}
              >
                <span
                  style={{
                    color: "#059669",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                    fontSize: "1.75rem",
                  }}
                >
                  TEAM MEMBERS
                </span>
                <span style={{ color: "#0f172a", fontWeight: "800" }}>
                  Ahtesham Khan
                </span>
                <span style={{ color: "#1e293b", fontWeight: "600" }}>
                  R.S Ravi
                </span>
                <span style={{ color: "#1e293b", fontWeight: "600" }}>
                  Rahul
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* DYNAMIC HEADER */}
        <motion.div
          animate={{
            marginTop: isWelcome ? "2vh" : "0px",
            marginBottom: isWelcome ? "0px" : "10px",
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", zIndex: 20, flexShrink: 0 }}
        >
          <motion.h1
            animate={{ fontSize: isWelcome ? "2.7rem" : "1.6rem" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: "linear-gradient(90deg, #0369a1, #0284c7, #0d9488)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              letterSpacing: "3px",
              fontWeight: "1000",
              textTransform: "uppercase",
              filter: "drop-shadow(0 2px 8px rgba(2, 132, 199, 0.3))",
            }}
          >
            TAMIL NADU SMART ENERGY GRID SYSTEM
          </motion.h1>
        </motion.div>

        {/* CENTER CONTENT */}
        <div
          style={{
            display: "flex",
            justify: "center",
            alignItems: "center",
            flexGrow: 1,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <AnimatePresence mode="wait">
            {/* WELCOME SCREEN */}
            {isWelcome && (
              <motion.div
                key="welcome-screen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justify: "center",
                  width: "100%",
                }}
              >
                <h2
                  style={{
                    fontSize: "8.25rem",
                    fontWeight: "900",
                    letterSpacing: "18px",
                    margin: "0",
                    lineHeight: "1",
                    color: "#ffffff",
                    WebkitTextFillColor: "#ffffff",
                    textShadow:
                      "0 4px 20px rgba(245, 247, 248, 0.4), 0 0 40px rgba(15, 23, 42, 0.25)",
                    filter: "drop-shadow(0 8px 16px rgba(15, 23, 42, 0.2))",
                  }}
                >
                  WELCOME
                </h2>
              </motion.div>
            )}

            {/* LIVE DATA TABLES */}
            {!isWelcome && powerData[activeSector] && (
              <motion.div
                key={activeSector}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: "100%",
                  maxWidth: "1600px",
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "100%",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    width: "100%",
                    flexShrink: 0,
                  }}
                >
                  <h2
                    style={{
                      fontSize: "1.45rem",
                      color: "#0f172a",
                      margin: 0,
                      fontWeight: "800",
                      letterSpacing: "0.8px",
                    }}
                  >
                    {powerData[activeSector].title}
                  </h2>
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "4px 16px",
                      border: "1.5px solid #0284c7",
                      borderRadius: "6px",
                      boxShadow: "0 2px 10px rgba(2, 132, 199, 0.15)",
                    }}
                  >
                    <span
                      style={{
                        color: "#475569",
                        fontSize: "1.02rem",
                        fontWeight: "700",
                      }}
                    >
                      TOTAL:{" "}
                    </span>
                    <strong
                      style={{
                        color: "#0284c7",
                        fontSize: "1.25rem",
                        fontWeight: "800",
                      }}
                    >
                      {powerData[activeSector].totalCapacity}
                    </strong>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    borderRadius: "14px",
                    border: "1.5px solid #94a3b8",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                    overflow: "hidden",
                    maxHeight: isHydro ? "570px" : "none",
                  }}
                >
                  <table
                    className={isHydro ? "hydro-table-container" : ""}
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                      fontSize: "1.05rem",
                    }}
                  >
                    <thead
                      style={{
                        position: "relative",
                        zIndex: 10,
                        backgroundColor: "#0f172a",
                        borderBottom: "2px solid #0284c7",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      <tr
                        style={{ backgroundColor: "#0f172a", color: "#38bdf8" }}
                      >
                        <th
                          style={{
                            padding: "10px 16px",
                            fontWeight: "800",
                            fontSize: "0.98rem",
                            letterSpacing: "0.8px",
                            backgroundColor: "#0f172a",
                          }}
                        >
                          PLANT / SYSTEM IDENTIFIER
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            fontWeight: "800",
                            fontSize: "0.98rem",
                            letterSpacing: "0.8px",
                            width: "180px",
                            backgroundColor: "#0f172a",
                          }}
                        >
                          POWER CAPACITY
                        </th>
                        <th
                          style={{
                            padding: "10px 16px",
                            fontWeight: "700",
                            fontSize: "0.98rem",
                            letterSpacing: "0.8px",
                            backgroundColor: "#0f172a",
                          }}
                        >
                          GRID LOGISTICS DETAILS
                        </th>
                      </tr>
                    </thead>
                    <tbody className={isHydro ? "hydro-scrolling-tbody" : ""}>
                      {displayPlants.map((plant, index) => (
                        <tr
                          key={index}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            backgroundColor:
                              index % 2 === 0 ? "#f8fafc" : "#ffffff",
                          }}
                        >
                          <td
                            style={{
                              padding: "8px 16px",
                              fontWeight: "700",
                              color: "#0f172a",
                              lineHeight: "1.25",
                            }}
                          >
                            {plant.name}
                          </td>
                          <td
                            style={{
                              padding: "8px 16px",
                              color: "#059669",
                              fontWeight: "800",
                              lineHeight: "1.25",
                              width: "180px",
                            }}
                          >
                            {plant.capacity}
                          </td>
                          <td
                            style={{
                              padding: "8px 16px",
                              color: "#334155",
                              fontWeight: "500",
                              lineHeight: "1.25",
                            }}
                          >
                            {plant.details}
                          </td>
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
