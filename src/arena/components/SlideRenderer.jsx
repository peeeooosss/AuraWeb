import React from 'react';
import HtmlSlideRenderer, { shouldRenderTemplateV2Html } from './HtmlSlideRenderer';

function extractTitle(slide) {
  const h = slide.content?.title_header?.header_title || '';
  return h.replace(/^[,\s]+/, '').substring(0, 80);
}

function extractBullets(slide) {
  const list = slide.content?.list_of_number_bullet_point_item?.grid_1 ||
              slide.content?.list_of_bullet_points?.grid_1 ||
              slide.content?.bullet_points?.grid_1 ||
              [];
  return list.map(item => ({
    number: item.item_number || '',
    heading: item.item_heading || '',
    body: item.item_body || '',
  }));
}

function extractBodyText(slide) {
  const body = slide.content?.body_text?.body || '';
  return body.substring(0, 300);
}

function extractImage(slide) {
  const img = slide.content?.top_right_image?.corner_photo ||
              slide.content?.center_image?.center_photo ||
              slide.content?.large_image?.photo;
  return img?.image_prompt || img?.image_url || '';
}

function extractSpeakerNote(slide) {
  return slide.content?.__speaker_note__ || '';
}

function FallbackSlide({ slide, index, total, compact }) {
  const title = extractTitle(slide);
  const bullets = extractBullets(slide);
  const bodyText = extractBodyText(slide);
  const image = extractImage(slide);
  const layout = slide.layout || 'general';

  const isDark = slide.layout_group === 'executive' || slide.layout_group === 'momentum';
  const accentColor = isDark ? '#A78BFA' : '#7C3AED';
  const bg = isDark ? '#1E1B4B' : '#FFFFFF';
  const fg = isDark ? '#F5F3FF' : '#101323';
  const muted = isDark ? '#A5B4FC' : '#6B7280';

  const slideStyle = {
    width: '100%',
    aspectRatio: '16/9',
    maxWidth: 960,
    background: bg,
    color: fg,
    borderRadius: compact ? 8 : 16,
    border: '1px solid #E5E7EB',
    padding: compact ? 24 : 48,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"Inter", sans-serif',
    boxShadow: compact ? '0 2px 8px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.12)',
  };

  return (
    <div style={slideStyle}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, #06B6D4, ${accentColor})` }} />
      {title && (
        <h2 style={{ fontSize: compact ? 16 : 28, fontWeight: 700, marginBottom: 24, lineHeight: 1.2, fontFamily: '"Syne", sans-serif' }}>
          {title}
        </h2>
      )}
      {bodyText && !bullets.length && (
        <p style={{ fontSize: compact ? 12 : 16, lineHeight: 1.6, color: muted }}>{bodyText}</p>
      )}
      {bullets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 16 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {b.number && (
                <span style={{
                  width: compact ? 24 : 32, height: compact ? 24 : 32, borderRadius: '50%',
                  background: `${accentColor}15`, border: `1.5px solid ${accentColor}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: compact ? 10 : 13, fontWeight: 700, color: accentColor, flexShrink: 0, marginTop: 2,
                }}>{b.number}</span>
              )}
              <div>
                {b.heading && <h4 style={{ fontSize: compact ? 12 : 16, fontWeight: 600, marginBottom: 4 }}>{b.heading}</h4>}
                {b.body && <p style={{ fontSize: compact ? 10 : 13, lineHeight: 1.5, color: muted }}>{b.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {image && (
        <div style={{
          position: 'absolute', top: compact ? 16 : 32, right: compact ? 16 : 32,
          width: compact ? 120 : 200, height: compact ? 90 : 150, borderRadius: 12,
          background: `${accentColor}10`, border: '1px dashed #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 9 : 11, color: muted,
        }}>{image.substring(0, 30)}...</div>
      )}
      {!title && !bodyText && !bullets.length && (
        <p style={{ color: muted, fontSize: compact ? 12 : 14, textAlign: 'center' }}>
          {layout.replace(/_/g, ' ')} layout — {slide.layout_group || 'general'}
        </p>
      )}
      <div style={{ position: 'absolute', bottom: compact ? 8 : 16, right: compact ? 12 : 24, fontSize: compact ? 9 : 11, color: muted }}>
        {index + 1} / {total}
      </div>
    </div>
  );
}

export default function SlideRenderer({ slide, index = 0, total = 1, compact = false }) {
  if (shouldRenderTemplateV2Html(slide)) {
    if (compact) {
      return <HtmlSlideRenderer slide={slide} fixedSize={false} className="rounded-lg overflow-hidden" />;
    }
    return (
      <div style={{ width: '100%', maxWidth: 960, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', position: 'relative' }}>
        <HtmlSlideRenderer slide={slide} fixedSize={false} />
        <div style={{ position: 'absolute', bottom: 16, right: 24, fontSize: 11, color: '#6B7280', pointerEvents: 'none' }}>
          {index + 1} / {total}
        </div>
      </div>
    );
  }

  return <FallbackSlide slide={slide} index={index} total={total} compact={compact} />;
}
