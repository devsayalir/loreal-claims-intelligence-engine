export const EMPTY_EVIDENCE = {
  studyDesign: '',
  sampleSize: '',
  studyDuration: '',
  evidenceText: '',
}

export function toEvidencePayload(evidence) {
  return {
    studyDesign: evidence.studyDesign,
    sampleSize: evidence.sampleSize ? Number(evidence.sampleSize) : undefined,
    studyDuration: evidence.studyDuration || undefined,
    evidenceText: evidence.evidenceText,
  }
}
