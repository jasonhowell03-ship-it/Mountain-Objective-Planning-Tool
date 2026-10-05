/*
 * PDF augmentation disabled.
 * The planner's native mopPdf() exporter is the single source of truth.
 * Keeping this file intentionally inert prevents a second copy of the plan
 * from being appended when jsPDF output('blob') is called.
 */
(()=>{window.mopPdfMirrorMode='native-only';})();