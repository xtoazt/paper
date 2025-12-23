# Paper

**Paper** is a browser-based web server runtime that works offline, routed via a local ephemeral ingress. It allows you to access locally emulated sites (like `blog.paper`) through your standard browser without traditional DNS or heavy local servers.

![Paper UI](https://via.placeholder.com/800x400?text=Paper+UI+Screenshot)

## 🚀 Deployment

Paper is designed to be hosted on **GitHub Pages**.

### One-Click Deployment
1. Fork this repository.
2. Go to **Settings > Pages** in your GitHub repository.
3. Select **GitHub Actions** as the Source.
4. Go to **Actions** tab and enable workflows if needed.
5. Push a commit or manually run the `Deploy Paper WebVM` workflow.
6. Open your new GitHub Pages URL.

## 🛠️ Local Usage

Once the "Paper Web" (the frontend) is running (either locally or on GitHub Pages), you need to connect the local ingress.

### 1. Start the Ingress
The ingress is a small Python script that bridges `127.0.0.1` to the WebVM.

```bash
# Recommended (Automatic /etc/hosts injection)
sudo python3 paper-proxy/src/main.py --port 80

# Alternative (Manual Config / PAC)
python3 paper-proxy/src/main.py --port 8080
```

### 2. Access Sites
Once connected (Green dot in UI), you can access:

*   [http://blog.paper](http://blog.paper) (or `blog.paper:8080` if not using sudo)
*   [http://shop.paper](http://shop.paper) (or `shop.paper:8080` if not using sudo)

## 🏗️ Architecture

```mermaid
graph TD
    User[User Browser] -->|http://blog.paper| LocalProxy[Local Ingress (Python)]
    LocalProxy -->|WebSocket| PaperWeb[Paper WebVM (React App)]
    PaperWeb -->|Emulated Response| LocalProxy
    LocalProxy -->|HTML| User
```

## 💻 Development

### Frontend (`paper-web`)
```bash
cd paper-web
npm install
npm run dev
```

### Backend (`paper-proxy`)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r paper-proxy/requirements.txt
```
