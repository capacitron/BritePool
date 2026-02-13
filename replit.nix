{ pkgs }: {
  deps = [
    pkgs.unzip
    pkgs.nodejs_20
    pkgs.nodePackages.typescript-language-server
    pkgs.postgresql
    pkgs.openssl
    pkgs.gh
  ];

  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.openssl
    ];
  };
}
