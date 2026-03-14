## The Build Method (Design System)

This project uses a custom high-end aesthetic called **"The Build Method"**.

- **Primary Aesthetic:** Black & Lime (High-Tech / Premium)
- **Core Tokens**:
  - `--primary`: `84 100% 59%` (Vibrant Lime)
  - `--background`: `0 0% 0%` (Onye Black)
- **Key Utilities**:
  - `.liquid-glass`: Heavy blur (20px+) with elegant glass borders.
  - `.aurora-bg`: Animated radial gradients for cinematic backgrounds.
  - `.lime-text`: Gradient text with lime glow.

## Known Gotchas & Interaction Notes

### 1. Login "Invisible Wall" Bug
When adding decorative overlays (like glows or gradient divs) to the login form, **always** include the `pointer-events-none` class. Failure to do so will block all mouse interaction (clicks/typing) with the underlying form inputs, creating an "invisible wall".

### 2. Framer Motion Imports
Ensure all layout components (`CoachLayout`, `ClientLayout`) have explicit `framer-motion` imports to prevent runtime `ReferenceError` crashes.

## How can I edit this code?
... (rest of the file)

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
