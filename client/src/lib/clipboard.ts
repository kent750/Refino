export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    // Use the modern Clipboard API
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or insecure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy text:', error);
      throw new Error('Failed to copy to clipboard');
    } finally {
      textArea.remove();
    }
  }
}

export function createReferenceClipboardText(reference: {
  title: string;
  description?: string;
  url: string;
  tags: string[];
  source: string;
}): string {
  return `${reference.title}
${reference.description || ''}
URL: ${reference.url}
Tags: ${reference.tags.join(', ')}
Source: ${reference.source}`;
}
