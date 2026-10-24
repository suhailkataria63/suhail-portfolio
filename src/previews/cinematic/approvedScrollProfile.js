// The manually approved continuous-scroll profile shared by the canonical
// portfolio and its reference preview. All distances remain on the single
// pinned GSAP/ScrollTrigger timeline.
const APPROVED_SCROLL_PROFILE = Object.freeze({
  scrollMode: 'continuous',
  shortenHeroTransition: true,
  shortenFinalProjectToBeyond: true,
  shortenBeyondToBuilderEntry: true,
  shortenBuilderRevealAndJourneyEntry: true,
  firstMilestoneEntranceSpan: 0.03,
  shortenJourneyToBeyondReveal: true,
  shortenCuriousToContact: true,
})

export default APPROVED_SCROLL_PROFILE
