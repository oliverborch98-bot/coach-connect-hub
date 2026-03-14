---
name: Spline 3D Integration
description: Skill for integrating and managing 3D web assets from Spline (spline.design).
---

# Spline 3D Integration Skill

This skill allows the agent to interact with Spline 3D assets and integrate them into the React frontend.

## Capabilities
- **Scene Integration**: Add Spline viewers to React components using `@splinetool/react-spline`.
- **Asset Management**: Identify and documentation Spline scene URLs and embed codes.
- **Dynamic 3D**: Implement interactive 3D elements that respond to application state.

## Usage
1. Ensure `@splinetool/react-spline` is installed: `npm install @splinetool/react-spline`
2. Import the component: `import Spline from '@splinetool/react-spline';`
3. Embed your scene: `<Spline scene="https://prod.spline.design/.../scene.splinecode" />`

## Best Practices
- Use `Suspense` for loading states of 3D scenes.
- Optimize 3D assets in Spline before exporting to ensure smooth performance in the Ultra-dark theme.
- Align 3D colors with the Gold accent (#D4A853) and Dark background (#1a1a2e).
