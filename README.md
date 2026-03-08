# Reddit Media Slideshow

A beautiful, immersive, and snappier slideshow application for browsing images and videos from your favorite subreddits. Designed for a lean-back experience with full-screen support and customizable playback.

![App Preview](https://picsum.photos/seed/reddit-slideshow/800/450)

## 🚀 Features

- **Immersive Slideshow**: High-quality display of images and videos.
- **Multi-Subreddit Feed**: Combine multiple subreddits into a single shuffled stream.
- **Customizable Timer**: Adjust slide duration from 2s to 30s via settings.
- **Grid View**: Quickly browse all loaded media in a gallery layout.
- **Optimized Loading**: Uses Reddit's preview CDN for faster image loading and includes visual loading states.
- **Fullscreen Mode**: One-click immersive viewing.
- **Persistent Settings**: Your subreddit list and timer preferences are saved to your browser's local storage.
- **Responsive Design**: Works beautifully on desktop and mobile.

## 🛠️ Technologies Used

- **React 19**
- **Vite**
- **Tailwind CSS**
- **Motion** (for smooth UI transitions)
- **Lucide React** (for iconography)
- **Reddit JSON API**

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/swagamaniac/redditslideshow.git
   cd redditslideshow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment (GitHub Pages)

This project is pre-configured for GitHub Pages deployment.

1. **Build and Deploy**:
   ```bash
   npm run deploy
   ```
   This command will build the project and push the `dist` folder to the `gh-pages` branch.

2. **Configure GitHub**:
   - Go to your repo **Settings > Pages**.
   - Set the source to **Deploy from a branch**.
   - Select the `gh-pages` branch.

## 📖 Usage

- **Add Subreddits**: Click the **Settings (gear icon)** and enter a subreddit name (e.g., `earthporn`).
- **Adjust Speed**: Use the slider in Settings to change how long each slide stays on screen.
- **Interact with Videos**: Click-to-skip is disabled to allow you to use the native video controls (play/pause, volume, seek).
- **Manual Navigation**: Use the arrows in the bottom-right corner to skip or go back.
- **Switch View**: Use the **Grid icon** in the header to toggle between the slideshow and the gallery view.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Note: This application fetches public data from Reddit. Please respect the content creators and Reddit's API terms of service.*
