import mammoth from 'mammoth';

export interface ParsedDocument {
  title: string;
  text: string;
  pageCount?: number;
}

export interface TextChunk {
  content: string;
  index: number;
  charStart: number;
  charEnd: number;
}

export class DocumentParser {
  /**
   * Extract raw text from uploaded Buffer depending on mime type or extension
   */
  public static async parseFile(buffer: Buffer, fileName: string, fileType: string): Promise<ParsedDocument> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf' || fileType.includes('pdf')) {
      try {
        const pdfModule: any = await import('pdf-parse');
        const pdfFunc = pdfModule.default || pdfModule;
        const parsed = await pdfFunc(buffer);
        return {
          title: fileName,
          text: parsed.text,
          pageCount: parsed.numpages,
        };
      } catch (err) {
        console.warn('pdf-parse failed, using raw buffer text extraction fallback:', err);
        return {
          title: fileName,
          text: buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' '),
        };
      }
    }

    if (ext === 'docx' || fileType.includes('officedocument')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        return {
          title: fileName,
          text: result.value,
        };
      } catch (err) {
        console.warn('mammoth parsing failed, using text fallback:', err);
        return {
          title: fileName,
          text: buffer.toString('utf-8'),
        };
      }
    }

    // Default for TXT, MD, CSV, JSON
    return {
      title: fileName,
      text: buffer.toString('utf-8'),
    };
  }

  /**
   * Overlapping Recursive Character Text Chunking
   */
  public static chunkText(
    text: string,
    chunkSize = 800,
    chunkOverlap = 150
  ): TextChunk[] {
    const sanitized = text.replace(/\r\n/g, '\n').trim();
    if (!sanitized) return [];

    const chunks: TextChunk[] = [];
    const separators = ['\n\n', '\n', '. ', '! ', '? ', ' ', ''];

    let currentIndex = 0;
    let chunkIdx = 0;

    while (currentIndex < sanitized.length) {
      let end = Math.min(currentIndex + chunkSize, sanitized.length);

      if (end < sanitized.length) {
        let breakFound = false;
        for (const sep of separators) {
          const sepIndex = sanitized.lastIndexOf(sep, end);
          if (sepIndex > currentIndex + Math.floor(chunkSize * 0.5)) {
            end = sepIndex + sep.length;
            breakFound = true;
            break;
          }
        }
      }

      const chunkContent = sanitized.slice(currentIndex, end).trim();
      if (chunkContent.length > 20) {
        chunks.push({
          content: chunkContent,
          index: chunkIdx++,
          charStart: currentIndex,
          charEnd: end,
        });
      }

      const step = end - currentIndex;
      if (step <= chunkOverlap) {
        currentIndex = end;
      } else {
        currentIndex = end - chunkOverlap;
      }
    }

    return chunks;
  }
}
