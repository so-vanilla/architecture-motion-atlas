{
  description = "Architecture Motion Atlas static React application";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;
        pname = "architecture-motion-atlas";
        version = "0.2.0";
        nodejs = pkgs.nodejs_24;
        buildNpmPackage = pkgs.buildNpmPackage.override { inherit nodejs; };
        src = lib.cleanSourceWith {
          src = ./.;
          filter =
            path: _type:
            let
              root = toString ./.;
              rel = lib.removePrefix "${root}/" (toString path);
            in
            !(lib.hasPrefix ".git/" rel
              || lib.hasPrefix "node_modules/" rel
              || lib.hasPrefix "docs/" rel
              || lib.hasPrefix ".devenv/" rel
              || lib.hasPrefix ".direnv/" rel
              || rel == "result"
              || lib.hasPrefix "result/" rel);
        };
        npmDepsHash = "sha256-cywF6wije8WTMnsLhS75uJsL86sbPhvXNxmYQaUFwOk=";
        package = buildNpmPackage {
          inherit pname version src npmDepsHash;
          npmBuildScript = "build";

          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/${pname}"
            cp -R docs/. "$out/share/${pname}/"
            runHook postInstall
          '';
        };
        mkCheck =
          name: command:
          buildNpmPackage {
            inherit version src npmDepsHash;
            name = "${pname}-${name}";
            pname = "${pname}-${name}";
            dontNpmBuild = true;

            buildPhase = ''
              runHook preBuild
              ${command}
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p "$out"
              touch "$out/${name}"
              runHook postInstall
            '';
          };
        devApp = pkgs.writeShellApplication {
          name = "architecture-motion-atlas-dev";
          runtimeInputs = [
            nodejs
          ];
          text = ''
            if [ ! -d node_modules ]; then
              npm install
            fi
            npm run dev -- "$@"
          '';
        };
      in
      {
        packages.default = package;

        checks = {
          build = package;
          lint = mkCheck "lint" "npm run lint";
          test = mkCheck "test" "npm run test";
          content = mkCheck "content" "npm run check:content";
          diagrams = mkCheck "diagrams" "npm run check:diagrams";
          routes = mkCheck "routes" "npm run check:routes";
          responsive = mkCheck "responsive" "npm run check:responsive";
        };

        apps.default = flake-utils.lib.mkApp { drv = devApp; };
        apps.dev = flake-utils.lib.mkApp { drv = devApp; };
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
