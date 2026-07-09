# Input file types

The various data schemas and files used for 3D inputs

## GLTF

A glTF (Graphics Library Transmission Format) file is a highly efficient, open-standard file format used to store and transmit 3D models and scenes. Often referred to as "the JPEG of 3D," it is designed for rapid loading and real-time rendering in web pages.

Low level. Deliberately close in conceptual structure to graphics card. The final mile. Expressed as JSON internally.

Does not carry full data. Depends on companion files for meshes and animation (.bin files). PNG and JPEG for textures.

Not just model compositing - but also cameras, lighting and (optical) materials.

## GLB

A binary format wrapper for a GLTF including the external files it depends on.

## IFC File

An IFC (Industry Foundation Classes) file is an open, standardized data format (usually .ifc or .ifcZIP) used in architecture and construction to share 3D models and data between different BIM (Building Information Modeling) software applications.

IFC to architecture and construction is what IGES or DXF is to 2d CAD - an open standardised format that all proprietary systems are more or less obliged to work with.

High level - it describes a building like a human would. And models the building semantically. For example HVAC systems.