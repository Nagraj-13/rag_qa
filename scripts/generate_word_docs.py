import os
import re
import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Define paths
base_dir = os.getcwd()
okf_dir = os.path.join(base_dir, 'docs', 'okf_wiki')
rag_dir = os.path.join(base_dir, 'docs', 'rag_sample_word_docs')

# Step 1: Delete all current docx files in the RAG directory
print("[CLEAN] Cleaning up old DOCX files in RAG directory...")
if os.path.exists(rag_dir):
    for f in os.listdir(rag_dir):
        if f.endswith('.docx'):
            os.remove(os.path.join(rag_dir, f))
else:
    os.makedirs(rag_dir, exist_ok=True)

# File mapping from OKF Markdown files to RAG DOCX files
file_mappings = {
    os.path.join('customer_support', '01_sla_and_escalation.md'): '01_Customer_Support_SLA_and_Escalation.docx',
    os.path.join('billing', '02_refund_and_subscription.md'): '02_Billing_Refund_and_Subscription_Policy.docx',
    os.path.join('technical', '03_troubleshooting_faq.md'): '03_Customer_Troubleshooting_and_FAQ_Manual.docx',
    os.path.join('returns', '04_warranty_and_rma.md'): '04_Product_Return_Warranty_and_RMA_Guide.docx',
    os.path.join('security', '05_account_security_and_privacy.md'): '05_Account_Security_and_Privacy_Policy.docx',
    os.path.join('products', '06_products_and_services.md'): '06_Products_and_Services_Catalog.docx',
}

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set cell padding in twentieths of a point (dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def parse_markdown_to_docx(md_path, docx_path):
    print(f"[PROCESS] processing: {os.path.basename(md_path)} -> DOCX: {os.path.basename(docx_path)}")
    
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split YAML frontmatter and body
    parts = content.split('---')
    if len(parts) >= 3:
        body = '---'.join(parts[2:]).strip()
    else:
        body = content.strip()

    doc = docx.Document()

    # Style definitions
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Arial'
    font.size = Pt(10.5)
    font.color.rgb = RGBColor(51, 65, 85) # Slate 700

    lines = body.split('\n')
    in_table = False
    table_headers = []
    table_rows = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Handle headings
        if line.startswith('#'):
            # Close existing table if any
            if in_table:
                create_word_table(doc, table_headers, table_rows)
                in_table = False
                table_headers = []
                table_rows = []

            level = len(line) - len(line.lstrip('#'))
            title_text = line.lstrip('#').strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(title_text)
            run.font.name = 'Arial'
            run.font.bold = True

            if level == 1:
                run.font.size = Pt(18)
                run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
            elif level == 2:
                run.font.size = Pt(14)
                run.font.color.rgb = RGBColor(79, 70, 229) # Indigo 600
            else:
                run.font.size = Pt(12)
                run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
            
            i += 1
            continue

        # Handle tables
        if line.startswith('|'):
            # Check if it is a separator line (e.g. |---|---|)
            if re.match(r'^\|[\s\-\|:]+\|$', line):
                i += 1
                continue

            cells = [c.strip() for c in line.split('|')[1:-1]]
            if not in_table:
                in_table = True
                table_headers = cells
            else:
                table_rows.append(cells)
            i += 1
            continue
        else:
            if in_table:
                # Table ended
                create_word_table(doc, table_headers, table_rows)
                in_table = False
                table_headers = []
                table_rows = []

        # Handle lists
        if line.startswith('- ') or line.startswith('* '):
            item_text = line[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(3)
            # Support bold markdown inside list items
            add_markdown_run(p, item_text)
            i += 1
            continue

        # Handle numbered lists
        match_num = re.match(r'^(\d+)\.\s+(.*)$', line)
        if match_num:
            item_text = match_num.group(2).strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_after = Pt(3)
            add_markdown_run(p, item_text)
            i += 1
            continue

        # Handle empty lines
        if not line:
            i += 1
            continue

        # Handle horizontal rule
        if line == '---':
            p = doc.add_paragraph()
            run = p.add_run("____________________________________________________")
            run.font.color.rgb = RGBColor(226, 232, 240) # Slate 200
            i += 1
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        add_markdown_run(p, line)
        i += 1

    # Close trailing table if document ends
    if in_table:
        create_word_table(doc, table_headers, table_rows)

    # Save document
    doc.save(docx_path)

def add_markdown_run(paragraph, text):
    """Simple parser for bold inline markdown (**text**)."""
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.font.bold = True
        else:
            paragraph.add_run(part)

def create_word_table(doc, headers, rows):
    if not headers:
        return
    col_count = len(headers)
    table = doc.add_table(rows=1, cols=col_count)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'

    # Set headers
    hdr_cells = table.rows[0].cells
    for col_idx, header_text in enumerate(headers):
        hdr_cells[col_idx].text = header_text
        set_cell_margins(hdr_cells[col_idx], top=120, bottom=120, left=150, right=150)
        
        # Style Header Run
        p = hdr_cells[col_idx].paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900

    # Set rows
    for row_data in rows:
        row_cells = table.add_row().cells
        # Handle cases where row might have fewer cells than headers
        for col_idx in range(min(col_count, len(row_data))):
            row_cells[col_idx].text = row_data[col_idx]
            set_cell_margins(row_cells[col_idx], top=100, bottom=100, left=150, right=150)
            
            p = row_cells[col_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            for run in p.runs:
                run.font.size = Pt(9.5)

    doc.add_paragraph() # Spacing below table

# Execute mappings
for rel_md, target_docx in file_mappings.items():
    md_full = os.path.join(okf_dir, rel_md)
    docx_full = os.path.join(rag_dir, target_docx)
    
    if os.path.exists(md_full):
        parse_markdown_to_docx(md_full, docx_full)
    else:
        print(f"[WARN] Source OKF file not found: {md_full}")

print("\n[SUCCESS] All DOCX documents compiled from latest OKF markdown source files!\n")
