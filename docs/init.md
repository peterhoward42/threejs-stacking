# Establishing this repo

# Overview

- I am going to experiment with various integration and orchestration software 
packages that sit on top of Three.js
- This repo is to keep that code all in one place
- This document is the seed for discussions about how to structure and operate
  the repo

# Constraints

- There will be a native 3js experiment where I will learn the basics of coding
  against 3js natively.
- Then there will a a handfull of other experiments that each explore the use
  of a different third party orchestration or composition layer
- These should be clearly separate from the point of view of
	-  where the code is
	-  where dev tooling is
	-  collaboration scope I have with the cursor AI integration tool
- The UI layer should be Svelte not Sveltekit
- Each of the experiments will likely have its own Makefile 
- It is ok to have some shared code/data in common - organised appropriately
- Because this is for rapid testing - there is no need for any testing code.
- This code will never be used in production - so where appropriate it can be
  assumed that dev-only processes and policies are ok.
- My main interaction m.o. while I am developing these experiments is to gain
  feedback simply by looking at the generated locall running website.
  
