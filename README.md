# pspCas13b crRNA design tool

Website: https://cas13b.github.io/

This is the code repsoitory for the Cas13b tool for **Single-base tiled screen reveals new design principles of PspCas13b for potent and off-target-free RNA silencing** by Wenxin Hu et al. of the Fareh Lab at the [Peter MacCallum Cancer Centre](https://www.petermac.org/).

## Quickstart:

1. Clone this repository
2. `CD public`
3. `python -m http.server`

## Development instructions:

1. `npm install`
2. Edit the code in `src`. The main code of interest will be in `src/js/cas13.ts`
3. `tsc` to compile the Typescript to Javascript. The tsconfig.json file is configured to output the files into the public folder.

## Folders:

- `public`: The website code
- `src`: The code, but in Typescript. This must be compiled to Javascript before it can be used in the website.
- `docs`: A mirror of the public folder, but used for Github Pages. This is automatically updated by Github Actions when the code is pushed to the `main` branch.
- `config`: A miscellaneous folder containing the `nginx.conf` file, which is used to configure the Nginx web server when run on [@david-ma](https://github.com/david-ma)'s hardware.
