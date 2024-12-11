# How to run
## setup
This WebGL project is built in Javascript. Install packages from packages.json using 'npm install' command.
## to run
Run with the 'npx vite' command to start a web server. Navigate to http://localhost:5173/ in a web browser.

# Libraries
## [Three.js](https://threejs.org/)
Three.js was used on top of WebGL to simplify the transition of much of the boiler plate code from our previous projects. 
## [WebGazer.js](https://webgazer.cs.brown.edu/)
WebGazer.js was used for eye tracking. This package uses the computer webcam to detect the pupils and estimate gaze on the screen. This works best if you move the mouse around a bit to help with calibration. 

# L- Systems

A Lindenmayer system (L System for short) is a rewriting system that allows us to model the "growth" of systems starting from a seed axiom.

L systems are usually represented in 2D such as the Koch snowflake or the fractal tree, but to make this more interesting visually, we expand this into 3D by adding more rules to describe rotations about different axes.

Reference: https://algorithmicbotany.org/papers/abop/abop-ch1.pdf

We used the above paper to inspire some of our L systems by taking already established L systems in 2d then modifying them to create a different one in 3D.

To use the L-system, we generate an L-system string with `generateLSystem`, then pass that into `drawLSystem` along with other parameters like the geometry, positions, rotation angle, etc.

# Foveated Rendering
Foveated rendering intends to improve efficiency by rendering a scene at multiple layers of eccentricity with decreasing resolution around a point. Here, the point is determined either by the eye gaze or the mouse cursor position. 

The [original publication](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/11/foveated_final15.pdf) contains extensive justification for how big these layers should be based on perceptual user studies. However, these calculations depend on metrics that are not available with webcam eye tracking, like distance to the screen, so these radii are tunable in our implementation.

To accomplish this, a framebuffer (or RenderTarget here) is used for each layer of eccentricity. Only the region of pixels within the corresponding layer radius is rendered using the setScissor function. Then, in the shader that renders the final image, the framebuffer to use is decided upon based on the distance at a point to the current gaze/mouse point. 

Other Resources:
- Similar project in OpenGL: https://github.com/GustavoSilvera/gl-fovrender/tree/main
- WebGL demo using setScissor: https://threejs.org/examples/?q=mu#webgl_multiple_views
- WebGL demo using renderTargets: https://threejs.org/examples/?q=mu#webgl_multiple_rendertargets

# Godrays and Texturing
Crepuscular lighting is comes from sunbeams during twilight hours that are obstructed by clouds/particles in the air. We tried to implement godrays based on [this article](https://fabiensanglard.net/lightScattering/) but struggled with combining scenes after postprocessing. We then pivoted to using the Effect Composer abilities of Three.js to render a bloom effect to the scene. Because this process was not as technical as hard coding the godrays we also added texturing to the cave to increase the scenes complexity and make it more interactive. 

We added texturing to the cave using triplanar mapping. We chose four different textures to apply to the cave and toggle on and off using the menu. Our caveVertexShader and caveFragmentShader apply triplanar mapping to the cave when a checkbox is clicked using the corresponding texture. If no checkbox is toggled the original material of the cave is stored in userData and then reapplied to the cave.

# Known Bugs
When eye tracking is enabled (Foveated Rendering is toggled on and Eyes, not Mouse are used), the app runs more slowly, sometimes below the minimum 24 fps depending on the machine. We implemented mouse controls as an alternative that seems quicker and allows more direct control to still demonstrate the technical feature.

