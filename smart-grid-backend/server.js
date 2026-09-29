const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let activePort = null;

// 🔍 AUTO-DETECT ARDUINO COM PORT FUNCTION
async function connectToArduino() {
  try {
    const ports = await SerialPort.list();
    console.log("🔍 Scanning available serial ports...");

    // Arduino Nano (Original ya CH340 Clone) ko detect karo
    const arduinoPortInfo = ports.find(p => {
      const vendorId = (p.vendorId || '').toLowerCase();
      const manufacturer = (p.manufacturer || '').toLowerCase();
      const pnpId = (p.pnpId || '').toLowerCase();

      // Arduino, CH340 (Common Clone Chip), ya FTDI USB drivers match
      return (
        vendorId.includes('2341') || // Official Arduino VID
        vendorId.includes('1a86') || // CH340 Chip VID
        manufacturer.includes('arduino') ||
        manufacturer.includes('wch.cn') ||
        manufacturer.includes('ftdi') ||
        pnpId.includes('usb')
      );
    });

    if (!arduinoPortInfo) {
      console.log("⚠️ No Arduino detected yet. Retrying in 3 seconds...");
      setTimeout(connectToArduino, 3000);
      return;
    }

    const comPath = arduinoPortInfo.path;
    console.log(`⚡ Found Arduino on port: ${comPath} (${arduinoPortInfo.manufacturer || 'USB Serial'})`);

    activePort = new SerialPort({
      path: comPath,
      baudRate: 9600,
      autoOpen: true
    });

    const parser = activePort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    // Physical Switch Data Receive Handler
    parser.on('data', (data) => {
      console.log('⚡ Hardware Signal Received:', data);

      if (data.startsWith("SW:")) {
        const switchNum = parseInt(data.split(":")[1]);
        io.emit('sector-switch', { status: 1, switch: switchNum });
      }
    });

    activePort.on('open', () => {
      console.log(`✅ AUTO-CONNECTED SUCCESSFULLY ON ${comPath}!`);
    });

    activePort.on('close', () => {
      console.log(`❌ Arduino disconnected from ${comPath}. Re-scanning...`);
      activePort = null;
      setTimeout(connectToArduino, 3000);
    });

    activePort.on('error', (err) => {
      console.log(`⚠️ Serial Port Error on ${comPath}:`, err.message);
      if (activePort && activePort.isOpen) activePort.close();
    });

  } catch (err) {
    console.log("⚠️ Error scanning serial ports:", err.message);
    setTimeout(connectToArduino, 3000);
  }
}

// Start Auto-Detection
connectToArduino();

// 🌐 SOCKET.IO CONNECTION FOR REACT UI
io.on('connection', (socket) => {
  console.log('💻 React UI Client Connected via Socket');
});

server.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});