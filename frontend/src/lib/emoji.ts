/**
 * ChatFlow Custom Emoji Engine
 * High-performance emoji parsing, category registry, and SVG vector rendering.
 */

export interface EmojiItem {
  id: string;
  name: string;
  unicode: string;
  category: EmojiCategory;
  keywords?: string[];
}

export type EmojiCategory =
  | 'recent'
  | 'smileys'
  | 'animals'
  | 'food'
  | 'activities'
  | 'travel'
  | 'objects'
  | 'symbols'
  | 'flags';

// Convert Unicode string to Hex code point string for Twemoji SVG CDN (or local SVG cache)
export function getEmojiCodePoint(unicode: string): string {
  const codePoints: string[] = [];
  for (let i = 0; i < unicode.length; i++) {
    const code = unicode.codePointAt(i);
    if (code !== undefined) {
      // Skip surrogate pair second half in iteration
      if (code > 0xffff) {
        i++;
      }
      // Strip variation selector-16 (fe0f) unless necessary
      const hex = code.toString(16);
      codePoints.push(hex);
    }
  }
  // Standard twemoji filename format
  return codePoints.filter((c) => c !== 'fe0e').join('-');
}

// Get SVG URL for the emoji
export function getEmojiSvgUrl(unicode: string): string {
  const hex = getEmojiCodePoint(unicode);
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;
}

// Comprehensive Emoji Category Registry
export const EMOJI_CATEGORIES: { id: EmojiCategory; label: string; icon: string }[] = [
  { id: 'recent', label: 'Recently Used', icon: '🕒' },
  { id: 'smileys', label: 'Smileys & People', icon: '😀' },
  { id: 'animals', label: 'Animals & Nature', icon: '🐻' },
  { id: 'food', label: 'Food & Drink', icon: '🍔' },
  { id: 'activities', label: 'Activities', icon: '⚽' },
  { id: 'travel', label: 'Travel & Places', icon: '✈️' },
  { id: 'objects', label: 'Objects', icon: '💡' },
  { id: 'symbols', label: 'Symbols', icon: '❤️' },
  { id: 'flags', label: 'Flags', icon: '🚩' },
];

export const CHATFLOW_EMOJIS: EmojiItem[] = [
  // Smileys & People
  { id: 'grinning', name: 'Grinning Face', unicode: '😀', category: 'smileys', keywords: ['smile', 'happy', 'grin'] },
  { id: 'joy', name: 'Face with Tears of Joy', unicode: '😂', category: 'smileys', keywords: ['laugh', 'cry', 'tears', 'lol'] },
  { id: 'rofl', name: 'Rolling on the Floor Laughing', unicode: '🤣', category: 'smileys', keywords: ['rofl', 'laugh'] },
  { id: 'heart_eyes', name: 'Heart Eyes', unicode: '😍', category: 'smileys', keywords: ['love', 'crush', 'heart'] },
  { id: 'kissing_heart', name: 'Face Blowing a Kiss', unicode: '😘', category: 'smileys', keywords: ['kiss', 'love'] },
  { id: 'smile', name: 'Smiling Face with Smiling Eyes', unicode: '😊', category: 'smileys', keywords: ['happy', 'warm', 'proud'] },
  { id: 'sweat_smile', name: 'Grinning Face with Sweat', unicode: '😅', category: 'smileys', keywords: ['relieved', 'nervous'] },
  { id: 'laughing', name: 'Grinning Squinting Face', unicode: '😆', category: 'smileys', keywords: ['laugh', 'happy'] },
  { id: 'wink', name: 'Winking Face', unicode: '😉', category: 'smileys', keywords: ['wink', 'flirt'] },
  { id: 'blush', name: 'Smiling Face with Closed Eyes', unicode: '☺️', category: 'smileys', keywords: ['shy', 'sweet'] },
  { id: 'yum', name: 'Face Savoring Food', unicode: '😋', category: 'smileys', keywords: ['yummy', 'delicious'] },
  { id: 'sunglasses', name: 'Smiling Face with Sunglasses', unicode: '😎', category: 'smileys', keywords: ['cool', 'chill'] },
  { id: 'star_struck', name: 'Star-Struck', unicode: '🤩', category: 'smileys', keywords: ['excited', 'star', 'eyes'] },
  { id: 'thinking', name: 'Thinking Face', unicode: '🤔', category: 'smileys', keywords: ['wonder', 'ponder', 'think'] },
  { id: 'neutral_face', name: 'Neutral Face', unicode: '😐', category: 'smileys', keywords: ['meh', 'indifferent'] },
  { id: 'expressionless', name: 'Expressionless Face', unicode: '😑', category: 'smileys', keywords: ['blank', 'unimpressed'] },
  { id: 'smirk', name: 'Smirking Face', unicode: '😏', category: 'smileys', keywords: ['smug', 'flirt'] },
  { id: 'unamused', name: 'Unamused Face', unicode: '😒', category: 'smileys', keywords: ['annoyed', 'displeased'] },
  { id: 'grimacing', name: 'Grimacing Face', unicode: '😬', category: 'smileys', keywords: ['awkward', 'nervous'] },
  { id: 'relieved', name: 'Relieved Face', unicode: '😌', category: 'smileys', keywords: ['peaceful', 'calm'] },
  { id: 'pensive', name: 'Pensive Face', unicode: '😔', category: 'smileys', keywords: ['sad', 'down'] },
  { id: 'sleeping', name: 'Sleeping Face', unicode: '😴', category: 'smileys', keywords: ['sleep', 'tired', 'zzz'] },
  { id: 'mask', name: 'Face with Medical Mask', unicode: '😷', category: 'smileys', keywords: ['sick', 'ill'] },
  { id: 'hot_face', name: 'Hot Face', unicode: '🥵', category: 'smileys', keywords: ['heat', 'summer'] },
  { id: 'cold_face', name: 'Cold Face', unicode: '🥶', category: 'smileys', keywords: ['freezing', 'winter'] },
  { id: 'exploding_head', name: 'Exploding Head', unicode: '🤯', category: 'smileys', keywords: ['mind blown', 'shocked'] },
  { id: 'partying', name: 'Partying Face', unicode: '🥳', category: 'smileys', keywords: ['party', 'celebrate'] },
  { id: 'hushed', name: 'Hushed Face', unicode: '😯', category: 'smileys', keywords: ['surprised', 'wow'] },
  { id: 'screaming', name: 'Face Screaming in Fear', unicode: '😱', category: 'smileys', keywords: ['shocked', 'scared', 'scream'] },
  { id: 'flushed', name: 'Flushed Face', unicode: '😳', category: 'smileys', keywords: ['embarrassed', 'blush'] },
  { id: 'pleading', name: 'Pleading Face', unicode: '🥺', category: 'smileys', keywords: ['puppy eyes', 'beg'] },
  { id: 'crying', name: 'Crying Face', unicode: '😢', category: 'smileys', keywords: ['tear', 'sad'] },
  { id: 'sob', name: 'Loudly Crying Face', unicode: '😭', category: 'smileys', keywords: ['bawl', 'crying'] },
  { id: 'angry', name: 'Angry Face', unicode: '😠', category: 'smileys', keywords: ['mad', 'furious'] },
  { id: 'rage', name: 'Pouting Face', unicode: '😡', category: 'smileys', keywords: ['rage', 'red'] },
  { id: 'thumbs_up', name: 'Thumbs Up', unicode: '👍', category: 'smileys', keywords: ['like', 'approve', 'ok'] },
  { id: 'thumbs_down', name: 'Thumbs Down', unicode: '👎', category: 'smileys', keywords: ['dislike'] },
  { id: 'clap', name: 'Clapping Hands', unicode: '👏', category: 'smileys', keywords: ['bravo', 'applause'] },
  { id: 'raised_hands', name: 'Raising Hands', unicode: '🙌', category: 'smileys', keywords: ['celebrate', 'praise'] },
  { id: 'handshake', name: 'Handshake', unicode: '🤝', category: 'smileys', keywords: ['deal', 'agree'] },
  { id: 'pray', name: 'Folded Hands', unicode: '🙏', category: 'smileys', keywords: ['please', 'thanks', 'hope'] },
  { id: 'muscle', name: 'Flexed Biceps', unicode: '💪', category: 'smileys', keywords: ['strong', 'power', 'flex'] },
  { id: 'wave', name: 'Waving Hand', unicode: '👋', category: 'smileys', keywords: ['hello', 'bye', 'hi'] },
  { id: 'punch', name: 'Oncoming Fist', unicode: '👊', category: 'smileys', keywords: ['bro fist', 'punch'] },
  { id: 'salute', name: 'Saluting Face', unicode: '🫡', category: 'smileys', keywords: ['respect', 'salute'] },
  { id: 'melting', name: 'Melting Face', unicode: '🫠', category: 'smileys', keywords: ['melt', 'hot', 'awkward'] },
  { id: 'eye_roll', name: 'Face with Rolling Eyes', unicode: '🙄', category: 'smileys', keywords: ['annoyed', 'duh'] },

  // Animals & Nature
  { id: 'dog', name: 'Dog Face', unicode: '🐶', category: 'animals', keywords: ['puppy', 'pet'] },
  { id: 'cat', name: 'Cat Face', unicode: '🐱', category: 'animals', keywords: ['kitty', 'kitten'] },
  { id: 'bear', name: 'Bear Face', unicode: '🐻', category: 'animals', keywords: ['bear'] },
  { id: 'panda', name: 'Panda Face', unicode: '🐼', category: 'animals', keywords: ['panda'] },
  { id: 'lion', name: 'Lion', unicode: '🦁', category: 'animals', keywords: ['king', 'rawr'] },
  { id: 'tiger', name: 'Tiger Face', unicode: '🐯', category: 'animals', keywords: ['tiger'] },
  { id: 'monkey', name: 'Monkey Face', unicode: '🐵', category: 'animals', keywords: ['monkey'] },
  { id: 'see_no_evil', name: 'See-No-Evil Monkey', unicode: '🙈', category: 'animals', keywords: ['monkey', 'blind'] },
  { id: 'hear_no_evil', name: 'Hear-No-Evil Monkey', unicode: '🙉', category: 'animals', keywords: ['monkey', 'deaf'] },
  { id: 'speak_no_evil', name: 'Speak-No-Evil Monkey', unicode: '🙊', category: 'animals', keywords: ['monkey', 'mute'] },
  { id: 'unicorn', name: 'Unicorn', unicode: '🦄', category: 'animals', keywords: ['magic', 'fantasy'] },
  { id: 'rabbit', name: 'Rabbit Face', unicode: '🐰', category: 'animals', keywords: ['bunny'] },
  { id: 'fox', name: 'Fox', unicode: '🦊', category: 'animals', keywords: ['fox'] },
  { id: 'butterfly', name: 'Butterfly', unicode: '🦋', category: 'animals', keywords: ['insect', 'pretty'] },
  { id: 'rose', name: 'Rose', unicode: '🌹', category: 'animals', keywords: ['flower', 'love', 'red'] },
  { id: 'sunflower', name: 'Sunflower', unicode: '🌻', category: 'animals', keywords: ['flower', 'yellow', 'summer'] },
  { id: 'blossom', name: 'Cherry Blossom', unicode: '🌸', category: 'animals', keywords: ['flower', 'sakura', 'pink'] },
  { id: 'herb', name: 'Herb', unicode: '🌿', category: 'animals', keywords: ['plant', 'leaf', 'green'] },
  { id: 'tree', name: 'Evergreen Tree', unicode: '🌲', category: 'animals', keywords: ['forest', 'nature'] },
  { id: 'four_leaf', name: 'Four Leaf Clover', unicode: '🍀', category: 'animals', keywords: ['lucky', 'luck'] },

  // Food & Drink
  { id: 'burger', name: 'Hamburger', unicode: '🍔', category: 'food', keywords: ['burger', 'fast food'] },
  { id: 'pizza', name: 'Pizza', unicode: '🍕', category: 'food', keywords: ['cheese', 'slice'] },
  { id: 'fries', name: 'French Fries', unicode: '🍟', category: 'food', keywords: ['fries', 'potatoes'] },
  { id: 'taco', name: 'Taco', unicode: '🌮', category: 'food', keywords: ['mexican', 'food'] },
  { id: 'sushi', name: 'Sushi', unicode: '🍣', category: 'food', keywords: ['japanese', 'fish'] },
  { id: 'ramen', name: 'Steaming Bowl', unicode: '🍜', category: 'food', keywords: ['noodle', 'soup'] },
  { id: 'icecream', name: 'Soft Ice Cream', unicode: '🍦', category: 'food', keywords: ['dessert', 'sweet'] },
  { id: 'cake', name: 'Birthday Cake', unicode: '🎂', category: 'food', keywords: ['celebrate', 'birthday'] },
  { id: 'donut', name: 'Doughnut', unicode: '🍩', category: 'food', keywords: ['sweet', 'doughnut'] },
  { id: 'cookie', name: 'Cookie', unicode: '🍪', category: 'food', keywords: ['chocolate', 'biscuit'] },
  { id: 'coffee', name: 'Hot Beverage', unicode: '☕', category: 'food', keywords: ['coffee', 'tea', 'cafe'] },
  { id: 'beer', name: 'Beer Mug', unicode: '🍺', category: 'food', keywords: ['drink', 'alcohol', 'cheers'] },
  { id: 'cheers', name: 'Clinking Beer Mugs', unicode: '🍻', category: 'food', keywords: ['toast', 'celebration'] },
  { id: 'wine', name: 'Wine Glass', unicode: '🍷', category: 'food', keywords: ['drink', 'wine'] },
  { id: 'cocktail', name: 'Cocktail Glass', unicode: '🍸', category: 'food', keywords: ['drink', 'party'] },
  { id: 'popcorn', name: 'Popcorn', unicode: '🍿', category: 'food', keywords: ['movie', 'snack'] },
  { id: 'apple', name: 'Red Apple', unicode: '🍎', category: 'food', keywords: ['fruit', 'healthy'] },

  // Activities
  { id: 'soccer', name: 'Soccer Ball', unicode: '⚽', category: 'activities', keywords: ['football', 'sport'] },
  { id: 'basketball', name: 'Basketball', unicode: '🏀', category: 'activities', keywords: ['hoop', 'sport'] },
  { id: 'cricket', name: 'Cricket Game', unicode: '🏏', category: 'activities', keywords: ['sport', 'bat'] },
  { id: 'tennis', name: 'Tennis', unicode: '🎾', category: 'activities', keywords: ['racket', 'sport'] },
  { id: 'gaming', name: 'Video Game', unicode: '🎮', category: 'activities', keywords: ['play', 'controller', 'game'] },
  { id: 'trophy', name: 'Trophy', unicode: '🏆', category: 'activities', keywords: ['winner', 'champion', 'first'] },
  { id: 'medal', name: '1st Place Medal', unicode: '🥇', category: 'activities', keywords: ['gold', 'winner'] },
  { id: 'target', name: 'Bullseye', unicode: '🎯', category: 'activities', keywords: ['goal', 'accurate'] },
  { id: 'guitar', name: 'Guitar', unicode: '🎸', category: 'activities', keywords: ['music', 'rock'] },
  { id: 'microphone', name: 'Microphone', unicode: '🎤', category: 'activities', keywords: ['sing', 'karaoke'] },
  { id: 'headphones', name: 'Headphone', unicode: '🎧', category: 'activities', keywords: ['music', 'audio'] },

  // Travel & Places
  { id: 'airplane', name: 'Airplane', unicode: '✈️', category: 'travel', keywords: ['flight', 'travel', 'trip'] },
  { id: 'rocket', name: 'Rocket', unicode: '🚀', category: 'travel', keywords: ['launch', 'fast', 'space'] },
  { id: 'car', name: 'Automobile', unicode: '🚗', category: 'travel', keywords: ['drive', 'vehicle'] },
  { id: 'motorcycle', name: 'Motorcycle', unicode: '🏍️', category: 'travel', keywords: ['bike', 'ride'] },
  { id: 'beach', name: 'Beach with Umbrella', unicode: '🏖️', category: 'travel', keywords: ['vacation', 'summer', 'sea'] },
  { id: 'island', name: 'Desert Island', unicode: '🏝️', category: 'travel', keywords: ['tropical', 'ocean'] },
  { id: 'city', name: 'Cityscape', unicode: '🏙️', category: 'travel', keywords: ['skyline', 'buildings'] },
  { id: 'sunrise', name: 'Sunrise Over Mountains', unicode: '🌄', category: 'travel', keywords: ['morning', 'nature'] },
  { id: 'house', name: 'House', unicode: '🏠', category: 'travel', keywords: ['home', 'living'] },

  // Objects
  { id: 'lightbulb', name: 'Light Bulb', unicode: '💡', category: 'objects', keywords: ['idea', 'smart'] },
  { id: 'money', name: 'Money with Wings', unicode: '💸', category: 'objects', keywords: ['cash', 'rich'] },
  { id: 'bag', name: 'Money Bag', unicode: '💰', category: 'objects', keywords: ['dollar', 'gold'] },
  { id: 'laptop', name: 'Laptop', unicode: '💻', category: 'objects', keywords: ['computer', 'code', 'work'] },
  { id: 'phone', name: 'Mobile Phone', unicode: '📱', category: 'objects', keywords: ['smartphone', 'cell'] },
  { id: 'envelope', name: 'Envelope', unicode: '✉️', category: 'objects', keywords: ['mail', 'letter'] },
  { id: 'gift', name: 'Wrapped Gift', unicode: '🎁', category: 'objects', keywords: ['present', 'birthday'] },
  { id: 'camera', name: 'Camera', unicode: '📷', category: 'objects', keywords: ['photo', 'picture'] },
  { id: 'fire', name: 'Fire', unicode: '🔥', category: 'objects', keywords: ['hot', 'lit', 'flame'] },
  { id: 'sparkles', name: 'Sparkles', unicode: '✨', category: 'objects', keywords: ['magic', 'shine', 'clean'] },
  { id: 'bomb', name: 'Bomb', unicode: '💣', category: 'objects', keywords: ['boom', 'explode'] },
  { id: 'gem', name: 'Gem Stone', unicode: '💎', category: 'objects', keywords: ['diamond', 'luxury'] },
  { id: 'key', name: 'Key', unicode: '🔑', category: 'objects', keywords: ['lock', 'access'] },

  // Symbols
  { id: 'red_heart', name: 'Red Heart', unicode: '❤️', category: 'symbols', keywords: ['love', 'heart'] },
  { id: 'orange_heart', name: 'Orange Heart', unicode: '🧡', category: 'symbols', keywords: ['love'] },
  { id: 'yellow_heart', name: 'Yellow Heart', unicode: '💛', category: 'symbols', keywords: ['love'] },
  { id: 'green_heart', name: 'Green Heart', unicode: '💚', category: 'symbols', keywords: ['love'] },
  { id: 'blue_heart', name: 'Blue Heart', unicode: '💙', category: 'symbols', keywords: ['love'] },
  { id: 'purple_heart', name: 'Purple Heart', unicode: '💜', category: 'symbols', keywords: ['love'] },
  { id: 'black_heart', name: 'Black Heart', unicode: '🖤', category: 'symbols', keywords: ['love', 'dark'] },
  { id: 'broken_heart', name: 'Broken Heart', unicode: '💔', category: 'symbols', keywords: ['sad', 'breakup'] },
  { id: 'hundred', name: 'Hundred Points', unicode: '💯', category: 'symbols', keywords: ['100', 'perfect'] },
  { id: 'check_mark', name: 'Check Mark', unicode: '✅', category: 'symbols', keywords: ['done', 'yes', 'correct'] },
  { id: 'cross_mark', name: 'Cross Mark', unicode: '❌', category: 'symbols', keywords: ['no', 'wrong', 'cancel'] },
  { id: 'warning', name: 'Warning', unicode: '⚠️', category: 'symbols', keywords: ['alert', 'danger'] },
  { id: 'star', name: 'Star', unicode: '⭐', category: 'symbols', keywords: ['rating', 'favorite'] },
  { id: 'lightning', name: 'High Voltage', unicode: '⚡', category: 'symbols', keywords: ['fast', 'electric', 'zap'] },
  { id: 'peace', name: 'Peace Symbol', unicode: '☮️', category: 'symbols', keywords: ['peace'] },

  // Flags
  { id: 'flag_us', name: 'United States', unicode: '🇺🇸', category: 'flags', keywords: ['usa', 'america'] },
  { id: 'flag_in', name: 'India', unicode: '🇮🇳', category: 'flags', keywords: ['india', 'bharat'] },
  { id: 'flag_gb', name: 'United Kingdom', unicode: '🇬🇧', category: 'flags', keywords: ['uk', 'britain'] },
  { id: 'flag_ca', name: 'Canada', unicode: '🇨🇦', category: 'flags', keywords: ['canada'] },
  { id: 'flag_de', name: 'Germany', unicode: '🇩🇪', category: 'flags', keywords: ['germany'] },
  { id: 'flag_fr', name: 'France', unicode: '🇫🇷', category: 'flags', keywords: ['france'] },
  { id: 'flag_jp', name: 'Japan', unicode: '🇯🇵', category: 'flags', keywords: ['japan'] },
  { id: 'flag_checkered', name: 'Chequered Flag', unicode: '🏁', category: 'flags', keywords: ['race', 'finish'] },
  { id: 'flag_rainbow', name: 'Rainbow Flag', unicode: '🏳️‍🌈', category: 'flags', keywords: ['pride', 'rainbow'] },
];

// Regex matching Unicode emoji sequences (including complex skin tones, ZWJ sequences, flags)
export const UNICODE_EMOJI_REGEX =
  /(?:\p{Regional_Indicator}{2}|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Regional_Indicator}{2}|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;

// Check if message content is strictly 1 to 3 emojis with no alphanumeric text
export function isEmojiOnlyMessage(text: string): { isEmojiOnly: boolean; count: number } {
  if (!text) return { isEmojiOnly: false, count: 0 };
  const trimmed = text.trim();
  const matches = trimmed.match(UNICODE_EMOJI_REGEX);
  if (!matches) return { isEmojiOnly: false, count: 0 };

  // Remove matched emojis and whitespace to verify no other text remains
  const textWithoutEmojis = trimmed.replace(UNICODE_EMOJI_REGEX, '').replace(/\s+/g, '');
  if (textWithoutEmojis.length === 0 && matches.length >= 1 && matches.length <= 3) {
    return { isEmojiOnly: true, count: matches.length };
  }
  return { isEmojiOnly: false, count: matches.length };
}

// Local Storage Recent Emojis Helper
const RECENT_EMOJIS_KEY = 'chatflow_recent_emojis_v1';
const MAX_RECENTS = 24;

export function getRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_EMOJIS_KEY);
    if (!raw) return ['❤️', '😂', '🔥', '👍', '😍', '✨', '🙌', '🎉'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : ['❤️', '😂', '🔥', '👍', '😍', '✨', '🙌', '🎉'];
  } catch {
    return ['❤️', '😂', '🔥', '👍', '😍', '✨', '🙌', '🎉'];
  }
}

export function saveRecentEmoji(emojiUnicode: string) {
  try {
    const current = getRecentEmojis().filter((e) => e !== emojiUnicode);
    const updated = [emojiUnicode, ...current].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save recent emoji:', err);
  }
}
