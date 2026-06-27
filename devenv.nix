{ pkgs, ... }:

{
  packages = [
    pkgs.nodejs_24
    pkgs.nixpkgs-fmt
  ];

  scripts.dev.exec = "npm run dev";
  scripts.check.exec = "npm run check";
  scripts.build.exec = "npm run build";

  enterShell = ''
    echo "architecture-motion-atlas: npm install | npm run dev | npm run check"
  '';
}
