import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useRef, useState } from "react";
import { Character, ClassNames } from "../../utils/CharacterUtils";
import { useAuth } from "../providers/AuthContext";
import { Roles, useDatabase, UserData } from "../providers/DatabaseContext";
import { CreateLfgPost } from "./CreateLfgPost";
import { JoinLfg } from "./JoinLfg";
import { RaidList } from "./RaidList";
import { CustomAlert } from "../global/CustomAlert";
import { DateTime } from "luxon";

export type Applicant = {
  uid: string;
  character: Character;
};
export type LfgPost = {
  title: string;
  startTime: string;
  ownerId: string;
  lfgId: string;
  applicants?: Applicant[];
};
export function LfgPosts() {
  const auth = useAuth();
  const db = useDatabase();
  const themeColors = useTheme().palette;
  const [createLfgPostVisible, setCreateLfgPostVisible] =
    useState<boolean>(false);
  const [editLfgPostVisible, setEditLfgPostVisible] = useState<boolean>(false);
  const [joinLfgVisible, setJoinLfgVisible] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const functionMenuVisible = Boolean(anchorEl);
  const joinLfgRef = useRef<LfgPost | null>(null);
  const errorPostRef = useRef<LfgPost | null>(null);
  const editLfgRef = useRef<LfgPost | null>(null);

  const [errorMsg, setErrorMsg] = useState<string>("");
  const [errorVisible, setErrorVisible] = useState<boolean>(false);

  const handleClickMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    post: LfgPost
  ) => {
    setAnchorEl(event.currentTarget);
    editLfgRef.current = post;
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  function getPostOwnerName(post: LfgPost): string {
    const users = db?.allUsers;
    if (users && users[post.ownerId]) {
      const owner: UserData = users[post.ownerId];
      if (owner) {
        return owner.userName;
      }
    }

    return "No name found";
  }

  function handleAddNewPost(post: LfgPost) {
    db?.addLfgPost(post);
  }

  function openJoinPartyModal(post: LfgPost) {
    joinLfgRef.current = post;
    if (db?.user?.characters !== undefined) {
      setJoinLfgVisible(true);
    } else {
      displayNoCharacterError();
    }
  }

  function findCharacterOwnerId(char: Character): string | undefined {
    if (db?.allUsers !== null && db?.allUsers !== undefined) {
      for (const key in db.allUsers) {
        if (db.allUsers[key].characters?.find((c) => c.id === char.id)) {
          return key;
        }
      }
    }

    return undefined;
  }
  function handleJoinLfg(char: Character) {
    if (auth?.currentUser?.uid && db?.joinLfg && joinLfgRef.current) {
      // save ref just in case
      errorPostRef.current = joinLfgRef.current;
      const ownerId = findCharacterOwnerId(char);

      // todo add errormessages?
      if (ownerId === undefined) return;
      const applicant: Applicant = {
        character: char,
        uid: ownerId,
      };
      db?.joinLfg(joinLfgRef.current, applicant)
        .then()
        .catch((e) => {
          setErrorMsg(e);

          setErrorVisible(true);
        });
      joinLfgRef.current = null;
    }
    setJoinLfgVisible(false);
  }

  function displayNoCharacterError() {
    alert("You dont have characters");
  }

  function handleDeleteLfg() {
    if (editLfgRef.current === null) return;
    db?.deleteLfgPost(editLfgRef.current)
      .then()
      .catch((e) => {
        console.log(e);
        setErrorMsg(e);
        errorPostRef.current = editLfgRef.current;
        setErrorVisible(true);
      })
      .finally((editLfgRef.current = null));
    handleCloseMenu();
  }
  function handleEditLfg(post: LfgPost) {
    db?.editLfgPost(post)
      .catch((e) => {
        console.log(e);
        setErrorMsg(e);
        errorPostRef.current = editLfgRef.current;
        setErrorVisible(true);
      })
      .finally((editLfgRef.current = null));
    handleCloseMenu();
  }
  function handleLeaveRaid(applicant: Applicant, post: LfgPost) {
    db?.leaveLfg(post, applicant);
  }
  function handleCloseError() {
    setErrorVisible(false);
    setErrorMsg("");
    errorPostRef.current = null;
  }
  function handleErrorVisible(post: LfgPost) {
    return errorPostRef.current?.lfgId === post.lfgId && errorVisible;
  }

  function isEditAllowed(post: LfgPost): boolean {
    if (post.ownerId === auth?.currentUser?.uid) return true;
    if (db?.user?.role === Roles.ADMIN) return true;
    return false;
  }

  function getWeekDay(post: LfgPost): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeek = new Date(post.startTime).getDay();
    return days[dayOfWeek];
  }
  function getAllCharacters(): Character[] {
    let listOfAllChars: Character[] = [];
    if (!db?.allUsers) return listOfAllChars;
    for (const key in db.allUsers) {
      const chars = db.allUsers[key].characters;
      if (chars !== undefined) {
        listOfAllChars = [...listOfAllChars, ...chars];
      }
    }
    return listOfAllChars;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!auth?.currentUser?.isAnonymous && (
        <Button
          sx={{ marginBottom: "10px", alignSelf: "center" }}
          onClick={() => setCreateLfgPostVisible(true)}
        >
          Create lfg post
        </Button>
      )}

      <CreateLfgPost
        visible={createLfgPostVisible}
        handleClose={() => setCreateLfgPostVisible(false)}
        handleAddNewPost={handleAddNewPost}
      />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {db?.lfgPosts?.map((post, index) => {
          return (
            <Paper key={index} sx={styles.postContainer}>
              <Box sx={styles.topRow}>
                <Box>
                  <Typography variant="h4">{post.title}</Typography>

                  <Box sx={styles.row}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: themeColors.primary.main,
                        align: "center",
                      }}
                    >
                      {`${getWeekDay(post)} ${DateTime.fromISO(
                        post.startTime
                      ).toLocaleString(DateTime.TIME_24_SIMPLE)}`}
                    </Typography>
                  </Box>
                  <Box sx={styles.row}>
                    <Typography>
                      {new Date(post.startTime).toLocaleDateString("fi")}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={styles.row}>
                  <Typography
                    sx={{
                      marginRight: "3px",
                      color: themeColors.grey["400"],
                    }}
                  >
                    Owner:
                  </Typography>
                  <Typography> {getPostOwnerName(post)}</Typography>
                </Box>

                <IconButton
                  disabled={!isEditAllowed(post)}
                  onClick={(e) => handleClickMenu(e, post)}
                  aria-label="settings"
                >
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  open={functionMenuVisible}
                  onClose={handleCloseMenu}
                  anchorEl={anchorEl}
                >
                  <MenuItem onClick={() => setEditLfgPostVisible(true)}>
                    Edit
                  </MenuItem>
                  <CreateLfgPost
                    visible={editLfgPostVisible}
                    handleClose={() => {
                      handleCloseMenu();
                      setEditLfgPostVisible(false);
                    }}
                    editExistingPost={editLfgRef.current ?? undefined}
                    handleEditExistingPost={(editedPost: LfgPost) =>
                      handleEditLfg(editedPost)
                    }
                  />
                  <MenuItem onClick={handleDeleteLfg}>Delete</MenuItem>
                </Menu>
              </Box>
              <RaidList
                applicants={post.applicants}
                raidSize={8}
                post={post}
                handleLeaveRaid={(applicant) =>
                  handleLeaveRaid(applicant, post)
                }
              />

              <Button
                onClick={() => openJoinPartyModal(post)}
                sx={{ alignSelf: "center" }}
              >
                Join party
              </Button>
              <CustomAlert
                visible={handleErrorVisible(post)}
                handleClose={handleCloseError}
                message={errorMsg}
              />

              {db.user?.characters !== undefined && (
                <JoinLfg
                  visible={joinLfgVisible}
                  onJoin={(char) => handleJoinLfg(char)}
                  handleClose={() => setJoinLfgVisible(false)}
                  characters={
                    db.user.role === Roles.ADMIN
                      ? getAllCharacters()
                      : db.user?.characters
                  }
                />
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  postContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
    padding: "10px",
    flex: 1,
  },
  topRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flex: 1,
  },
  partyContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    flex: 1,
  },
  playerCard: {
    padding: "10px",
    marginTop: "1em",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
};
