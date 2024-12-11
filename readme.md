Run with 'npx vite'

# L- Systems

A Lindenmayer system (L System for short) is a rewriting system that allows us to model the "growth" of systems starting from a seed axiom.

L systems are usually represented in 2D such as the Koch snowflake or the fractal tree, but to make this more interesting visually, we expand this into 3D by adding more rules to describe rotations about different axes.

Reference: https://algorithmicbotany.org/papers/abop/abop-ch1.pdf

We used the above paper to inspire some of our L systems by taking already established L systems in 2d then modifying them to create a different one in 3D.

To use the L-system, we generate an L-system string with `generateLSystem`, then pass that into `drawLSystem` along with other parameters like the geometry, positions, rotation angle, etc.
