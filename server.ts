import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function rotatePaymentNumbers() {
  try {
    const configRef = doc(db, 'config', 'payments');
    const snap = await getDoc(configRef);
    
    if (!snap.exists()) return;
    
    const data = snap.data();
    const lastRotation = new Date(data.lastRotation).getTime();
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    
    if (now - lastRotation >= tenMinutesInMs) {
      console.log('Rotating payment numbers...');
      
      const update: any = {
        lastRotation: new Date().toISOString()
      };
      
      // Rotate each method
      ['bkash', 'nagad', 'rocket'].forEach(method => {
        const numbers = data[method] || [];
        if (numbers.length > 0) {
          const currentIndex = data[`${method}Index`] || 0;
          update[`${method}Index`] = (currentIndex + 1) % numbers.length;
        }
      });
      
      await updateDoc(configRef, update);
      console.log('Payment numbers rotated successfully.');
    }
  } catch (error) {
    console.error('Error rotating payment numbers:', error);
  }
}

async function startServer() {
  const expressApp = express();
  const PORT = 3000;

  // Background Job: Check every 1 minute
  setInterval(rotatePaymentNumbers, 60 * 1000);
  // Initial check on startup
  rotatePaymentNumbers();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
