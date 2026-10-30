# MA206 WPR2 Review Board

Jeopardy-style review board (48 clues from Recognition Drills 1 and 2) with phone buzzers.

- `/`      Master board. You run this one on the projector.
- `/buzz`  Team buzzer. Each team opens this on one phone or laptop and taps their team name.
- Buzz order is decided by when each buzz reaches the server, so it is the same for everyone.

## Run it on your laptop (quickest test)
    npm install
    npm start
Open http://localhost:3000 . Phones must be on the same network and open http://YOUR-LAPTOP-IP:3000/buzz .
Many campus/guest networks block phone-to-laptop traffic. If so, use a hosted deploy below.

## Deploy free on Render
1. Put this folder in a GitHub repo.
2. Render > New > Web Service > pick the repo.
3. Build command: `npm install`   Start command: `npm start`
4. (Optional) Environment variable `HOST_PIN` = a number only you know. Then open the master at `https://YOUR-APP.onrender.com/?pin=THATNUMBER`. Without the pin, nobody can award points or open buzzers, but the board still loads.
5. Teams go to `https://YOUR-APP.onrender.com/buzz` (put this on the first slide or a QR code).
Railway and Fly.io work the same way: any host that runs `node server.js` and supports WebSockets.
Free Render services sleep after idle time. Open the master page a minute before class to wake it.

## In class
Setup screen: choose teams, "Buzz in" mode, timer. Teams tap their name on their phone. When you open a clue, buzzers go live. The first team shows highlighted on your screen with 1st, 2nd, 3rd for the rest. Judge with the check and X. A wrong answer locks that team's phone for the clue and moves to the next buzzer. Keys 1 to 8 still log a buzz by hand if a phone fails.

## Notes
- State lives in the master browser (saved locally), so a server restart only drops live buzzer connections. Phones reconnect by themselves.
- One game at a time per server. Do not share the host link.
- Final clue is an added question, not from the drills. Edit `FINAL` near the top of `public/index.html`.
