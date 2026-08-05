type BinaryKey = "ghostscript" | "qpdf" | "pdftoppm" | "libreoffice";

const ENV_VAR_MAP: Record<BinaryKey, string> = {
  ghostscript: "GHOSTSCRIPT_BIN",
  qpdf: "QPDF_BIN",
  pdftoppm: "PDFTOPPM_BIN",
  libreoffice: "LIBREOFFICE_BIN",
};

const WINDOWS_DEFAULTS: Record<BinaryKey, string> = {
  ghostscript: "gswin64c",
  qpdf: "qpdf",
  pdftoppm: "pdftoppm",
  libreoffice: "soffice.com",
};

const LINUX_DEFAULTS: Record<BinaryKey, string> = {
  ghostscript: "gs",
  qpdf: "qpdf",
  pdftoppm: "pdftoppm",
  libreoffice: "libreoffice",
};

export function resolveBinary(key: BinaryKey): string {
  const envOverride = process.env[ENV_VAR_MAP[key]];
  if (envOverride) return envOverride;

  const defaults = process.platform === "win32" ? WINDOWS_DEFAULTS : LINUX_DEFAULTS;
  return defaults[key];
}
