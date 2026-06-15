export interface Suggestion {
  text: string;
  tone: string;
}

const SUGGESTIONS: Record<number, Suggestion[]> = {
  1: [
    { text: "Had a disappointing experience overall. Several things did not meet expectations.", tone: "Critical" },
    { text: "Service was very slow and communication was lacking throughout.", tone: "Critical" },
    { text: "The staff did not seem attentive and the process felt unorganized.", tone: "Critical" },
    { text: "Faced multiple issues during the visit and they were not handled properly.", tone: "Critical" },
    { text: "The overall experience was frustrating and needs significant improvement.", tone: "Critical" },
    { text: "Waited much longer than expected and received very little assistance.", tone: "Critical" },
    { text: "The service quality was poor and did not feel customer-focused.", tone: "Critical" },
    { text: "Expectations were not met and the experience felt poorly managed.", tone: "Critical" },
    { text: "There were too many problems for the visit to be enjoyable.", tone: "Critical" },
    { text: "Would appreciate major improvements in service and responsiveness.", tone: "Critical" },
  ],

  2: [
    { text: "The experience was below expectations and could be improved in several areas.", tone: "Honest" },
    { text: "Service was inconsistent and the overall process felt a bit disorganized.", tone: "Honest" },
    { text: "Staff were polite but the experience did not feel very smooth.", tone: "Honest" },
    { text: "Waiting time was longer than expected and affected the overall experience.", tone: "Honest" },
    { text: "A few things went well, but there were noticeable areas for improvement.", tone: "Honest" },
    { text: "Customer handling could have been more attentive and efficient.", tone: "Honest" },
    { text: "The service felt average at best and lacked consistency.", tone: "Honest" },
    { text: "Communication could have been clearer throughout the experience.", tone: "Honest" },
    { text: "The place was fine, but the overall experience felt underwhelming.", tone: "Honest" },
    { text: "More attention to detail would greatly improve the customer experience.", tone: "Honest" },
  ],

  3: [
    { text: "The experience was decent overall with room for improvement.", tone: "Balanced" },
    { text: "Service was satisfactory but there were a few delays.", tone: "Balanced" },
    { text: "Everything was alright, though nothing particularly stood out.", tone: "Balanced" },
    { text: "Staff were helpful and the experience was fairly smooth.", tone: "Balanced" },
    { text: "It was an average experience and met basic expectations.", tone: "Balanced" },
    { text: "A few improvements in service speed would make a difference.", tone: "Balanced" },
    { text: "The overall experience was fine but could be more consistent.", tone: "Balanced" },
    { text: "Things were handled reasonably well throughout the visit.", tone: "Balanced" },
    { text: "The place was comfortable and the service was acceptable.", tone: "Balanced" },
    { text: "Not a bad experience, but there is scope for improvement.", tone: "Balanced" },
  ],

  4: [
    { text: "Had a very good experience overall. Everything was managed well.", tone: "Positive" },
    { text: "The staff were friendly and made the visit comfortable.", tone: "Positive" },
    { text: "Service was quick and the overall process was smooth.", tone: "Positive" },
    { text: "Really appreciated the professionalism shown throughout.", tone: "Positive" },
    { text: "The experience was pleasant and exceeded most expectations.", tone: "Positive" },
    { text: "Everything felt organized and well coordinated.", tone: "Positive" },
    { text: "The team was helpful and responsive whenever needed.", tone: "Positive" },
    { text: "Had a positive experience and would happily visit again.", tone: "Positive" },
    { text: "The quality of service was impressive and reliable.", tone: "Positive" },
    { text: "Overall very satisfied with the experience and service provided.", tone: "Positive" },
  ],

  5: [
    { text: "Excellent experience from start to finish. Everything was outstanding.", tone: "Excellent" },
    { text: "The staff were extremely welcoming and attentive throughout.", tone: "Excellent" },
    { text: "Service was exceptional and exceeded all expectations.", tone: "Excellent" },
    { text: "Could not have asked for a better experience. Highly satisfied.", tone: "Excellent" },
    { text: "Everything was handled perfectly and with great professionalism.", tone: "Excellent" },
    { text: "The attention to detail really stood out during the visit.", tone: "Excellent" },
    { text: "The overall experience was seamless and highly enjoyable.", tone: "Excellent" },
    { text: "Staff went above and beyond to ensure satisfaction.", tone: "Excellent" },
    { text: "Exceptional service quality and a wonderful customer experience.", tone: "Excellent" },
    { text: "Would strongly recommend based on the excellent experience received.", tone: "Excellent" },
  ],
};

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function getSuggestionsForRating(rating: number): Suggestion[] {
  return shuffle(SUGGESTIONS[rating] ?? []).slice(0, 5);
}